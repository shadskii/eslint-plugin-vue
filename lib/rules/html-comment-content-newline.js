/**
 * @author Yosuke ota
 * See LICENSE file in root directory for full license.
 */
'use strict'

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

const commentParser = require('../utils/html-comment-parser')

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const COMMENT_DIRECTIVE = /^\s*eslint-(?:en|dis)able/

function parseOption (param) {
  if (param && typeof param === 'string') {
    return {
      singleline: param,
      multiline: param
    }
  }
  return Object.assign({
    singleline: 'never',
    multiline: 'always'
  }, param)
}

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'enforce unified line brake in a HTML comment',
      category: undefined,
      url: 'https://github.com/vuejs/eslint-plugin-vue/blob/v5.0.0/docs/rules/html-comment-content-newline.md'
    },
    fixable: 'whitespace',
    schema: [
      {
        anyOf: [
          {
            enum: ['always', 'never']
          },
          {
            type: 'object',
            properties: {
              'singleline': { enum: ['always', 'never', 'ignore'] },
              'multiline': { enum: ['always', 'never', 'ignore'] }
            },
            additionalProperties: false
          }
        ]
      },
      {
        type: 'object',
        properties: {
          exceptions: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      expectedAfterHTMLCommentOpen: "Expected line break after '<!--'.",
      expectedBeforeHTMLCommentOpen: "Expected line break before '-->'.",
      expectedAfterExceptionBlock: 'Expected line break after exception block.',
      expectedBeforeExceptionBlock: 'Expected line break before exception block.',
      unexpectedAfterHTMLCommentOpen: "Unexpected line breaks after '<!--'.",
      unexpectedBeforeHTMLCommentOpen: "Unexpected line breaks before '-->'."
    }
  },

  create (context) {
    // Unless the first option is never, require a newline
    const option = parseOption(context.options[0])

    return commentParser.defineVisitor(context, context.options[1], (comment) => {
      if (COMMENT_DIRECTIVE.test(comment.node.value)) {
        return
      }
      if (!comment.value) {
        return
      }
      const startLine = comment.openDecoration ? comment.openDecoration.loc.end.line : comment.value.loc.start.line
      const endLine = comment.closeDecoration ? comment.closeDecoration.loc.start.line : comment.value.loc.end.line
      const newlineType = startLine === endLine
        ? option.singleline
        : option.multiline
      if (newlineType === 'ignore') {
        return
      }
      checkCommentOpen(comment, newlineType !== 'never')
      checkCommentClose(comment, newlineType !== 'never')
    })

    /**
     * Reports the newline before the contents of a given comment if it's invalid.
     * @param {string} comment - a comment.
     * @param {boolean} requireNewline - `true` if line breaks are required.
     * @returns {void}
     */
    function checkCommentOpen (comment, requireNewline) {
      const beforeToken = comment.openDecoration || comment.open

      if (requireNewline) {
        if (beforeToken.loc.end.line < comment.value.loc.start.line) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: beforeToken.loc.end,
            end: comment.value.loc.start
          },
          messageId: comment.openDecoration ? 'expectedAfterExceptionBlock' : 'expectedAfterHTMLCommentOpen',
          fix: comment.openDecoration ? undefined : (fixer) => fixer.insertTextAfter(beforeToken, '\n')
        })
      } else {
        if (beforeToken.loc.end.line === comment.value.loc.start.line) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: beforeToken.loc.end,
            end: comment.value.loc.start
          },
          messageId: 'unexpectedAfterHTMLCommentOpen',
          fix: (fixer) => fixer.replaceTextRange([beforeToken.range[1], comment.value.range[0]], ' ')
        })
      }
    }

    /**
     * Reports the space after the contents of a given comment if it's invalid.
     * @param {string} comment - a comment.
     * @param {boolean} requireNewline - `true` if line breaks are required.
     * @returns {void}
     */
    function checkCommentClose (comment, requireNewline) {
      const afterToken = comment.closeDecoration || comment.close

      if (requireNewline) {
        if (comment.value.loc.end.line < afterToken.loc.start.line) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: comment.value.loc.end,
            end: afterToken.loc.start
          },
          messageId: comment.closeDecoration ? 'expectedBeforeExceptionBlock' : 'expectedBeforeHTMLCommentOpen',
          fix: comment.closeDecoration ? undefined : (fixer) => fixer.insertTextBefore(afterToken, '\n')
        })
      } else {
        if (comment.value.loc.end.line === afterToken.loc.start.line) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: comment.value.loc.end,
            end: afterToken.loc.start
          },
          messageId: 'unexpectedBeforeHTMLCommentOpen',
          fix: (fixer) => fixer.replaceTextRange([comment.value.range[1], afterToken.range[0]], ' ')
        })
      }
    }
  }
}

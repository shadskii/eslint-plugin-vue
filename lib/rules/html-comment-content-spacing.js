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
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'enforce unified spacing in a HTML comment',
      category: undefined,
      url: 'https://github.com/vuejs/eslint-plugin-vue/blob/v5.0.0/docs/rules/html-comment-content-spacing.md'
    },
    fixable: 'whitespace',
    schema: [
      {
        enum: ['always', 'never']
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
      expectedAfterHTMLCommentOpen: "Expected space after '<!--'.",
      expectedBeforeHTMLCommentOpen: "Expected space before '-->'.",
      expectedAfterExceptionBlock: 'Expected space after exception block.',
      expectedBeforeExceptionBlock: 'Expected space before exception block.',
      unexpectedAfterHTMLCommentOpen: "Unexpected space after '<!--'.",
      unexpectedBeforeHTMLCommentOpen: "Unexpected space before '-->'."
    }
  },

  create (context) {
    // Unless the first option is never, require a space
    const requireSpace = context.options[0] !== 'never'

    return commentParser.defineVisitor(context, context.options[1], (comment) => {
      if (!comment.value) {
        return
      }
      checkCommentOpen(comment)
      checkCommentClose(comment)
    })

    /**
     * Reports the space before the contents of a given comment if it's invalid.
     * @param {string} comment - a comment.
     * @returns {void}
     */
    function checkCommentOpen (comment) {
      const beforeToken = comment.openDecoration || comment.open
      if (beforeToken.loc.end.line !== comment.value.loc.start.line) {
        // Ignore newline
        return
      }

      if (requireSpace) {
        if (beforeToken.range[1] < comment.value.range[0]) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: beforeToken.loc.end,
            end: comment.value.loc.start
          },
          messageId: comment.openDecoration ? 'expectedAfterExceptionBlock' : 'expectedAfterHTMLCommentOpen',
          fix: comment.openDecoration ? undefined : (fixer) => fixer.insertTextAfter(beforeToken, ' ')
        })
      } else {
        if (comment.openDecoration) {
          // Ignore expection block
          return
        }
        if (beforeToken.range[1] === comment.value.range[0]) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: beforeToken.loc.end,
            end: comment.value.loc.start
          },
          messageId: 'unexpectedAfterHTMLCommentOpen',
          fix: (fixer) => fixer.removeRange([beforeToken.range[1], comment.value.range[0]])
        })
      }
    }

    /**
     * Reports the space after the contents of a given comment if it's invalid.
     * @param {string} comment - a comment.
     * @returns {void}
     */
    function checkCommentClose (comment) {
      const afterToken = comment.closeDecoration || comment.close
      if (comment.value.loc.end.line !== afterToken.loc.start.line) {
        // Ignore newline
        return
      }

      if (requireSpace) {
        if (comment.value.range[1] < afterToken.range[0]) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: comment.value.loc.end,
            end: afterToken.loc.start
          },
          messageId: comment.closeDecoration ? 'expectedBeforeExceptionBlock' : 'expectedBeforeHTMLCommentOpen',
          fix: comment.closeDecoration ? undefined : (fixer) => fixer.insertTextBefore(afterToken, ' ')
        })
      } else {
        if (comment.closeDecoration) {
          // Ignore expection block
          return
        }
        if (comment.value.range[1] === afterToken.range[0]) {
          // Is valid
          return
        }
        context.report({
          loc: {
            start: comment.value.loc.end,
            end: afterToken.loc.start
          },
          messageId: 'unexpectedBeforeHTMLCommentOpen',
          fix: (fixer) => fixer.removeRange([comment.value.range[1], afterToken.range[0]])
        })
      }
    }
  }
}

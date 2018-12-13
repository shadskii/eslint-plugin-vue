
const utils = require('./index')

/**
 * Define HTML comment parser
 *
 * @param {SourceCode} sourceCode The source code instance.
 * @param {object} config The config.
 * @returns {object} HTML comment parser.
 */
function defineParser (sourceCode, config) {
  config = config || {}

  const exceptions = config.exceptions || []

  /**
   * HTML Comment token
   */
  class CommentToken {
    constructor (type, value, range) {
      this.type = type
      this.value = value
      this.range = range
    }
    get loc () {
      return this._loc || (this._loc = {
        start: sourceCode.getLocFromIndex(this.range[0]),
        end: sourceCode.getLocFromIndex(this.range[1])
      })
    }
  }

  /**
   * Get a open decoration string from comment contents.
   * @param {string} contents comment contents
   * @returns {string} decoration string
   */
  function getOpenDecoration (contents) {
    let decoration = ''
    for (const exception of exceptions) {
      const length = exception.length
      let index = 0
      while (contents.startsWith(exception, index)) {
        index += length
      }
      const exceptionLength = index
      if (decoration.length < exceptionLength) {
        decoration = contents.slice(0, exceptionLength)
      }
    }
    return decoration
  }

  /**
   * Get an close decoration string from comment contents.
   * @param {string} contents comment contents
   * @returns {string} decoration string
   */
  function getCloseDecoration (contents) {
    let decoration = ''
    for (const exception of exceptions) {
      const length = exception.length
      let index = contents.length
      while (contents.endsWith(exception, index)) {
        index -= length
      }
      const exceptionLength = contents.length - index
      if (decoration.length < exceptionLength) {
        decoration = contents.slice(index)
      }
    }
    return decoration
  }

  /**
   * Parse HTMLComment.
   * @param {ASTNode} node a comment node
   * @returns {object} the result of parsing HTMLComment.
   */
  function parseHTMLComment (node) {
    let valueText = node.value
    const openDecorationText = getOpenDecoration(valueText)
    valueText = valueText.slice(openDecorationText.length)
    const firstCharIndex = valueText.search(/\S/)
    const beforeSpace = firstCharIndex >= 0 ? valueText.slice(0, firstCharIndex) : valueText
    valueText = valueText.slice(beforeSpace.length)

    const closeDecorationText = getCloseDecoration(valueText)
    if (closeDecorationText) {
      valueText = valueText.slice(0, -closeDecorationText.length)
    }
    const lastCharIndex = valueText.search(/\S\s*$/)
    const afterSpace = lastCharIndex >= 0 ? valueText.slice(lastCharIndex + 1) : valueText
    if (afterSpace) {
      valueText = valueText.slice(0, -afterSpace.length)
    }

    let tokenIndex = node.range[0]
    const createToken = (type, value) => {
      const range = [tokenIndex, tokenIndex + value.length]
      tokenIndex = range[1]
      return new CommentToken(type, value, range)
    }
    const open = createToken('HTMLCommentOpen', '<!--')
    const openDecoration = openDecorationText ? createToken('HTMLCommentOpenDecoration', openDecorationText) : undefined
    tokenIndex += beforeSpace.length
    const value = valueText ? createToken('HTMLCommentValue', valueText) : undefined
    tokenIndex += afterSpace.length
    const closeDecoration = closeDecorationText ? createToken('HTMLCommentCloseDecoration', closeDecorationText) : undefined
    const close = createToken('HTMLCommentClose', '-->')

    return {
      /** original comment node */
      node,
      /** HTML comment open (`<!--`) */
      open,
      /** decoration of the start of HTML comments. (`*****` when `<!--*****`) */
      openDecoration,
      /** value of HTML comment. whitespaces and other tokens are not included. */
      value,
      /** decoration of the end of HTML comments.  (`*****` when `*****-->`) */
      closeDecoration,
      /** HTML comment close (`-->`) */
      close
    }
  }

  return parseHTMLComment
}

/**
 * Define HTML comment visitor
 *
 * @param {RuleContext} context The rule context.
 * @param {object} config The config.
 * @param {function} visitComment The HTML comment visitor.
 * @returns {object} HTML comment visitor.
 */
function defineVisitor (context, config, visitComment) {
  return {
    Program (node) {
      if (utils.hasInvalidEOF(node)) {
        return
      }
      if (!node.templateBody) {
        return
      }
      const parseHTMLComment = defineParser(context.getSourceCode(), config)

      for (const comment of node.templateBody.comments) {
        visitComment(parseHTMLComment(comment))
      }
    }
  }
}

module.exports = {
  defineParser,
  defineVisitor
}

'use strict'

const commentParser = require('../../../lib/utils/html-comment-parser')
const chai = require('chai')

const assert = chai.assert

describe('defineParser()', () => {
  function newMockToken (comment) {
    return {
      type: 'HTMLComment',
      value: comment.slice(4, -3),
      range: [0, comment.length]
    }
  }

  it('should build the correct tokens.', () => {
    const parse = commentParser.defineParser(null, null)

    assert.deepEqual(parse(newMockToken('<!--comment-->')), {
      node: {
        type: 'HTMLComment',
        range: [0, 14],
        value: 'comment'
      },
      open: {
        type: 'HTMLCommentOpen',
        range: [0, 4],
        value: '<!--'
      },
      openDecoration: undefined,
      value: {
        type: 'HTMLCommentValue',
        range: [4, 11],
        value: 'comment'
      },
      closeDecoration: undefined,
      close: {
        type: 'HTMLCommentClose',
        range: [11, 14],
        value: '-->'
      }
    })
    assert.deepEqual(parse(newMockToken('<!-- comment -->')), {
      node: {
        type: 'HTMLComment',
        range: [0, 16],
        value: ' comment '
      },
      open: {
        type: 'HTMLCommentOpen',
        range: [0, 4],
        value: '<!--'
      },
      openDecoration: undefined,
      value: {
        type: 'HTMLCommentValue',
        range: [5, 12],
        value: 'comment'
      },
      closeDecoration: undefined,
      close: {
        type: 'HTMLCommentClose',
        range: [13, 16],
        value: '-->'
      }
    })
    assert.deepEqual(parse(newMockToken('<!-- c o m m e n t -->')), {
      node: {
        type: 'HTMLComment',
        range: [0, 22],
        value: ' c o m m e n t '
      },
      open: {
        type: 'HTMLCommentOpen',
        range: [0, 4],
        value: '<!--'
      },
      openDecoration: undefined,
      value: {
        type: 'HTMLCommentValue',
        range: [5, 18],
        value: 'c o m m e n t'
      },
      closeDecoration: undefined,
      close: {
        type: 'HTMLCommentClose',
        range: [19, 22],
        value: '-->'
      }
    })
    assert.deepEqual(parse(newMockToken('<!--\ncomment\ncomment\n-->')), {
      node: {
        type: 'HTMLComment',
        range: [0, 24],
        value: '\ncomment\ncomment\n'
      },
      open: {
        type: 'HTMLCommentOpen',
        range: [0, 4],
        value: '<!--'
      },
      openDecoration: undefined,
      value: {
        type: 'HTMLCommentValue',
        range: [5, 20],
        value: 'comment\ncomment'
      },
      closeDecoration: undefined,
      close: {
        type: 'HTMLCommentClose',
        range: [21, 24],
        value: '-->'
      }
    })
    assert.deepEqual(parse(newMockToken('<!---->')), {
      node: {
        type: 'HTMLComment',
        range: [0, 7],
        value: ''
      },
      open: {
        type: 'HTMLCommentOpen',
        range: [0, 4],
        value: '<!--'
      },
      openDecoration: undefined,
      value: undefined,
      closeDecoration: undefined,
      close: {
        type: 'HTMLCommentClose',
        range: [4, 7],
        value: '-->'
      }
    })
    assert.deepEqual(parse(newMockToken('<!--   -->')), {
      node: {
        type: 'HTMLComment',
        range: [0, 10],
        value: '   '
      },
      open: {
        type: 'HTMLCommentOpen',
        range: [0, 4],
        value: '<!--'
      },
      openDecoration: undefined,
      value: undefined,
      closeDecoration: undefined,
      close: {
        type: 'HTMLCommentClose',
        range: [7, 10],
        value: '-->'
      }
    })
  })

  it('should build the correct decoration block tokens.', () => {
    const parse = commentParser.defineParser(null, { exceptions: ['*', '+'] })

    assert.deepInclude(parse(newMockToken('<!--*****comment*****-->')), {
      openDecoration: {
        type: 'HTMLCommentOpenDecoration',
        range: [4, 9],
        value: '*****'
      },
      value: {
        type: 'HTMLCommentValue',
        range: [9, 16],
        value: 'comment'
      },
      closeDecoration: {
        type: 'HTMLCommentCloseDecoration',
        range: [16, 21],
        value: '*****'
      }
    })
    assert.deepInclude(parse(newMockToken('<!--***** comment +++++-->')), {
      openDecoration: {
        type: 'HTMLCommentOpenDecoration',
        range: [4, 9],
        value: '*****'
      },
      value: {
        type: 'HTMLCommentValue',
        range: [10, 17],
        value: 'comment'
      },
      closeDecoration: {
        type: 'HTMLCommentCloseDecoration',
        range: [18, 23],
        value: '+++++'
      }
    })
    assert.deepInclude(parse(newMockToken('<!-- ***** c ***** -->')), {
      openDecoration: undefined,
      value: {
        type: 'HTMLCommentValue',
        range: [5, 18],
        value: '***** c *****'
      },
      closeDecoration: undefined
    })
    assert.deepInclude(parse(newMockToken('<!--*****-->')), {
      openDecoration: {
        type: 'HTMLCommentOpenDecoration',
        range: [4, 9],
        value: '*****'
      },
      value: undefined,
      closeDecoration: undefined
    })
  })
})

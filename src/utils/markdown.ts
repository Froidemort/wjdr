import DOMPurify from 'dompurify'
import { marked } from 'marked'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h3', 'h4', 'a', 'hr']
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel']
const SAFE_HREF = /^(?:https?:|mailto:)/i

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') {
    return
  }

  const href = node.getAttribute('href')
  if (href !== null && !SAFE_HREF.test(href.trim())) {
    node.removeAttribute('href')
  }
  node.setAttribute('target', '_blank')
  node.setAttribute('rel', 'noopener noreferrer nofollow')
})

export function renderSafeMarkdown(source: string | null | undefined): string {
  if (!source) {
    return ''
  }

  const html = marked.parse(source, { gfm: true, breaks: true, async: false }) as string
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

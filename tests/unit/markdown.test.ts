// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderSafeMarkdown } from '../../src/utils/markdown'

function parse(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

describe('renderSafeMarkdown', () => {
  it('renders bold', () => {
    expect(renderSafeMarkdown('**gras**')).toContain('<strong>gras</strong>')
  })

  it('renders italic', () => {
    expect(renderSafeMarkdown('*italique*')).toContain('<em>italique</em>')
  })

  it('renders an unordered list', () => {
    const root = parse(renderSafeMarkdown('- a\n- b'))
    expect(root.querySelectorAll('ul > li')).toHaveLength(2)
  })

  it('renders an ordered list', () => {
    const root = parse(renderSafeMarkdown('1. a\n2. b'))
    expect(root.querySelectorAll('ol > li')).toHaveLength(2)
  })

  it('renders a blockquote', () => {
    const root = parse(renderSafeMarkdown('> citation'))
    expect(root.querySelector('blockquote')?.textContent).toContain('citation')
  })

  it('removes script tags', () => {
    const html = renderSafeMarkdown('texte <script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('removes onerror attributes', () => {
    const html = renderSafeMarkdown('<a href="https://example.com" onerror="alert(1)">x</a>')
    expect(html).not.toContain('onerror')
  })

  it('removes javascript: hrefs', () => {
    const root = parse(renderSafeMarkdown('[x](javascript:alert(1))'))
    expect(root.querySelector('a')?.hasAttribute('href')).toBe(false)
  })

  it('removes img tags', () => {
    const html = renderSafeMarkdown('![alt](https://example.com/a.png)\n\n<img src="x" onerror="alert(1)">')
    expect(html).not.toContain('<img')
  })

  it('removes data: urls', () => {
    const root = parse(renderSafeMarkdown('[x](data:text/html;base64,PHNjcmlwdD4=)'))
    expect(root.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect(root.innerHTML).not.toContain('data:')
  })

  it('adds target and rel on external links', () => {
    const link = parse(renderSafeMarkdown('[site](https://example.com)')).querySelector('a')
    expect(link?.getAttribute('href')).toBe('https://example.com')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer nofollow')
  })

  it.each([null, undefined, ''])('returns an empty string for %j', (value) => {
    expect(renderSafeMarkdown(value)).toBe('')
  })
})

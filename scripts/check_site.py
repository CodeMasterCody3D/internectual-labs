"""Check static HTML structure, local links, fragments, and referenced assets."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.refs, self.stack = path, [], [], []
        self.feed(path.read_text(encoding='utf-8'))
        assert not self.stack, (path, 'Unclosed tags', self.stack)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.refs.append(attrs[key])
        if attrs.get('target') == '_blank':
            assert 'noopener' in attrs.get('rel', '').split(), (self.path, attrs)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1] == tag, (self.path, tag, self.stack[-3:])
        self.stack.pop()

root = Path(__file__).resolve().parents[1]
pages = {p.name: Page(p) for p in root.glob('*.html')}
for name, page in pages.items():
    assert all(n == 1 for n in Counter(page.ids).values()), (name, 'Duplicate IDs')
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        target = root / unquote(url.path) if url.path else root / name
        assert target.exists(), (name, 'Missing local target', ref)
        if url.fragment and target.suffix == '.html':
            assert unquote(url.fragment) in pages[target.name].ids, (name, 'Missing fragment', ref)
print(f'PASS: {len(pages)} HTML pages; balanced tags, unique IDs, local links, fragments, assets, safe new-tab links')

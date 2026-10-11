import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

// Ham HTML işlenmez (rehype-raw yok) ve çıktı ayrıca rehype-sanitize
// (GitHub şeması) ile temizlenir: script, on* olayları ve javascript: linkleri atılır.
export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

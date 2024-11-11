
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    // Code blocks and inline code
    code: ({ node, inline, className, children, ...props }: any) => {
      return !inline ? (
        <pre className="my-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-sm"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-outside ml-6 my-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-outside ml-6 my-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="my-2">{children}</li>
    ),

    // Block elements
    p: ({ children }: any) => (
      <p className="my-4">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 my-4 italic">
        {children}
      </blockquote>
    ),

    // Inline elements
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),
    a: ({ href, children }: any) => (
      <Link 
        href={href} 
        className="text-blue-500 hover:underline"
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </Link>
    ),

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-zinc-200 dark:border-zinc-700">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-left">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-zinc-200 dark:border-zinc-700 px-4 py-2">
        {children}
      </td>
    ),
  };

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

export default Markdown;
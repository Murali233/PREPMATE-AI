/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import { LuCopy, LuCheck } from "react-icons/lu";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIResponsePreview = ({ content }) => {
    if (!content) return null;

    const customMarkdownComponents = {
        // Main title styling
        h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b pb-4">
                {children}
            </h1>
        ),
        // Section headers
        h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-8 mb-4">
                {children}
            </h2>
        ),
        // Regular paragraphs
        p: ({ children }) => (
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {children}
            </p>
        ),
        // Enhanced bullet points
        ul: ({ children }) => (
            <ul className="space-y-2 list-disc pl-6 mb-6">
                {children}
            </ul>
        ),
        li: ({ children }) => (
            <li className="text-gray-700 dark:text-gray-300">
                {children}
            </li>
        ),
        // Code blocks with better styling
        code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return !inline ? (
                <div className="my-6">
                    <CodeBlock
                        code={String(children).replace(/\n$/, '')}
                        language={language}
                    />
                </div>
            ) : (
                <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono" {...props}>
                    {children}
                </code>
            );
        },
        // Blockquote for real-world analogy
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 my-4 italic text-gray-700">
                {children}
            </blockquote>
        )
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="prose prose-slate dark:prose-invert max-w-none p-6">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    components={customMarkdownComponents}
                >
                    {typeof content === 'string' ? content : content.explanation}
                </ReactMarkdown>
            </div>
        </div>
    );
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {content.title}
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {content.explanation}
                        </ReactMarkdown>
                    </div>

                    {content.keyPoints && content.keyPoints.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Key Points
                            </h2>
                            <ul className="space-y-2 pl-5 list-disc">
                                {content.keyPoints.map((point, index) => (
                                    <li key={index} className="text-gray-700 dark:text-gray-300">
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        // Fallback for other content types
        return <pre className="whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
    };

    // Markdown components configuration
    const markdownComponents = {
        code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            const isInline = !className;

            return !isInline ? (
                <CodeBlock
                    code={String(children).replace(/\n$/, '')}
                    language={language}
                />
            ) : (
                <code className="px-1 py-0.5 bg-gray-100 rounded text-sm" {...props}>
                    {children}
                </code>
            );
        },
        p({ children }) {
            return <p className="mb-4 leading-5">{children}</p>;
        },
        strong({ children }) {
            return <strong>{children}</strong>;
        },
        em({ children }) {
            return <em>{children}</em>;
        },
        ul({ children }) {
            return <ul className="list-disc pl-6 space-y-2 my-4">{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal pl-6 space-y-2 my-4">{children}</ol>;
        },
        li({ children }) {
            return <li className="mb-1">{children}</li>;
        },
        blockquote({ children }) {
            return <blockquote className="border-1-4 border-gray-200 pl-4 italic my-4">{children}</blockquote>;
        },
        h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="text-lg font-bold mt-5 mb-2">{children}</h3>;
        },
        h4({ children }) {
            return <h4 className="text-base font-bold mt-4 mb-2">{children}</h4>;
        },
        a({ children, href }) {
            return <a href={href} className="text-blue-600 hover:underline">{children}</a>;
        },
        table({ children }) {
            return (
                <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-300 border border-gray">
                        {children}
                    </table>
                </div>
            );
        },
        thead({ children }) {
            return <thead className="bg-gray-50">{children}</thead>;
        },
        tbody({ children }) {
            return <tbody className="divide-y divide-gray-200">{children}</tbody>;
        },
        tr({ children }) {
            return <tr>{children}</tr>;
        },
        th({ children }) {
            return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
        },
        td({ children }) {
            return <td className="px-3 py-2 whitespace-nowrap text-sm">{children}</td>;
        },
        hr() {
            return <hr className="my-6 border-gray-200" />;
        },
        img({ src, alt }) {
            return <img src={src} alt={alt} className="my-4 max-w-full rounded" />;
        },
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {renderContent()}
        </div>
    );
};

const CodeBlock = ({ code, language }) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="relative my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-4 py-2">
                <span className="font-mono text-xs">{language || 'code'}</span>
                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Copy to clipboard"
                >
                    {isCopied ? (
                        <>
                            <LuCheck size={14} className="text-green-600" />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <LuCopy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'python'}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    background: '#1e1e1e',
                }}
                wrapLines={true}
                showLineNumbers={true}
                lineNumberStyle={{
                    minWidth: '2.25em',
                    paddingRight: '1em',
                    textAlign: 'right',
                    color: '#6e7681',
                    userSelect: 'none',
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};
export default AIResponsePreview;
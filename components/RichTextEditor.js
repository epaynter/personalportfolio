import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet'
];

const RichTextEditor = ({ content, onChange }) => {
  const [value, setValue] = useState(content || '');

  useEffect(() => {
    setValue(content || '');
  }, [content]);

  const handleChange = (content) => {
    setValue(content);
    onChange(content);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={handleChange}
        modules={modules}
        formats={formats}
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
    </div>
  );
};

export default RichTextEditor; 
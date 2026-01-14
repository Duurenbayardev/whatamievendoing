'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TagFilterProps {
  tags: string[];
}

function TagFilterContent({ tags }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag');

  const handleTagClick = (tag: string) => {
    // Clear search and category params when clicking a tag
    const params = new URLSearchParams();
    
    if (selectedTag === tag) {
      // If clicking the same tag, deselect it - show all products
      params.delete('tag');
    } else {
      // Set the selected tag and remove search/category
      params.set('tag', tag);
    }
    
    router.push(`/shop?${params.toString()}`);
  };

  if (tags.length === 0) return null;

  return (
    <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
      <div className="flex gap-3 min-w-max md:flex-wrap md:min-w-0">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-4 py-2 text-xs font-light tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${
              selectedTag === tag
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-400'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TagFilter({ tags }: TagFilterProps) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <TagFilterContent tags={tags} />
    </Suspense>
  );
}

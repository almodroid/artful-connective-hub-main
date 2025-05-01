
import React from 'react';

/**
 * Utility for parsing text with hashtags and mentions
 */

// Regex patterns for detecting hashtags and mentions
const HASHTAG_REGEX = /#(\w+)/g;
const MENTION_REGEX = /@(\w+)/g;
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

/**
 * Parse text to identify hashtags and mentions
 */
export const parseText = (text: string): { text: string; hashtags: string[]; mentions: string[] } => {
  // Extract hashtags
  const hashtags: string[] = [];
  const hashtagMatches = text.match(HASHTAG_REGEX);
  
  if (hashtagMatches) {
    hashtagMatches.forEach(tag => {
      const cleanTag = tag.substring(1); // Remove the # symbol
      if (!hashtags.includes(cleanTag)) {
        hashtags.push(cleanTag);
      }
    });
  }
  
  // Extract mentions
  const mentions: string[] = [];
  const mentionMatches = text.match(MENTION_REGEX);
  
  if (mentionMatches) {
    mentionMatches.forEach(mention => {
      const cleanMention = mention.substring(1); // Remove the @ symbol
      if (!mentions.includes(cleanMention)) {
        mentions.push(cleanMention);
      }
    });
  }
  
  return { text, hashtags, mentions };
};

/**
 * Render text with highlighted hashtags, mentions, and URLs
 */
export const renderFormattedText = (text: string): JSX.Element[] => {
  // Split the text by hashtags, mentions, and URLs
  const parts = [];
  let lastIndex = 0;
  let match;
  
  // Combined regex for hashtags, mentions, and URLs
  const combinedRegex = new RegExp(`${HASHTAG_REGEX.source}|${MENTION_REGEX.source}|${URL_REGEX.source}`, 'g');
  
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add the text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the hashtag, mention, or URL with styling
    const matchedText = match[0];
    if (matchedText.startsWith('#')) {
      parts.push({
        type: 'hashtag',
        text: matchedText,
        value: matchedText.substring(1)
      });
    } else if (matchedText.startsWith('@')) {
      parts.push({
        type: 'mention',
        text: matchedText,
        value: matchedText.substring(1)
      });
    } else if (matchedText.match(URL_REGEX)) {
      parts.push({
        type: 'url',
        text: matchedText,
        value: matchedText
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add the remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // Convert parts to React elements
  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return <span key={index}>{part}</span>;
    } else if (part.type === 'hashtag') {
      return (
        <a 
          key={index}
          href={`/explore?tag=${part.value}`} 
          className="text-primary hover:underline"
        >
          {part.text}
        </a>
      );
    } else if (part.type === 'mention') {
      return (
        <a 
          key={index}
          href={`/profile/${part.value}`} 
          className="text-primary hover:underline"
        >
          {part.text}
        </a>
      );
    } else if (part.type === 'url') {
      return (
        <a 
          key={index}
          href={part.value} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {part.text}
        </a>
      );
    }
    return null;
  }).filter(Boolean) as JSX.Element[];
};

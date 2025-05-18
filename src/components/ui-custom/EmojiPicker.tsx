import { useState } from 'react';
import { Input } from '../ui/input';
import { useTranslation } from '../../hooks/use-translation';

const EMOJI_CATEGORIES = [
  { name: 'smileys_emotion', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'] },
  { name: 'people_body', emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿'] },
  { name: 'objects', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💌', '💝', '💘', '💋', '🎈', '🎉', '🎊', '🎂', '🎁', '🎄', '🎀'] },
  { name: 'symbols', emojis: ['⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '❄️', '💦', '💧', '☔', '⛄', '🌈', '🌊', '🎵', '🎶', '💭', '💬', '💡', '❓', '❗', '💯', '✅', '❌', '⭕', '🔴', '🟡', '🟢', '🔵'] },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = searchQuery
    ? EMOJI_CATEGORIES.map(category => ({
        ...category,
        emojis: category.emojis.filter(emoji =>
          emoji.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.emojis.length > 0)
    : EMOJI_CATEGORIES;

  return (
    <div className="p-2">
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('Search emojis...')}
        className="mb-2"
      />
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-sm font-medium mb-2">{t(category.name)}</h3>
            <div className="grid grid-cols-8 gap-1">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="p-1.5 hover:bg-muted rounded-md text-lg"
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
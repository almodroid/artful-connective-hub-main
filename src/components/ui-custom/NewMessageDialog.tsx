import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../hooks/use-messages';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/use-translation';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Search, MessageSquare, Loader2 } from 'lucide-react';

type User = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
};

export function NewMessageDialog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation } = useMessages();
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user?.id) // Exclude current user
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async (userId: string) => {
    if (!user) return;
    
    setCreating(true);
    try {
      const conversationId = await createConversation(userId);
      if (conversationId) {
        setOpen(false);
        navigate(`/messages/${conversationId}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          {t('New Message')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('New Message')}</DialogTitle>
          <DialogDescription>
            {t('Search for a user to start a conversation')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2 mt-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by username or name')}
            className="flex-1"
          />
          <Button type="submit" disabled={searching || !searchQuery.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
        
        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {searchResults.length === 0 && searchQuery && !searching ? (
            <p className="text-center text-muted-foreground py-4">
              {t('No users found')}
            </p>
          ) : (
            searchResults.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center gap-3 p-3 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => handleStartConversation(user.id)}
              >
                <Avatar>
                  <AvatarImage src={user.avatar_url} alt={user.display_name} />
                  <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={creating}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartConversation(user.id);
                  }}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
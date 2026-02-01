import { useState, useEffect } from "react";
import { Image, Send, X, Link as LinkIcon, GalleryHorizontalEnd, SmilePlus, Loader2, Video, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePosts } from "@/hooks/use-posts";
import { useTranslation } from "@/hooks/use-translation";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { formatTag, formatTagForDisplay } from '@/utils/tag-utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const giphy = new GiphyFetch(import.meta.env.VITE_GIPHY_KEY || '');

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { createPost, uploading } = usePosts();
  const { isRtl, t } = useTranslation();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'images' | 'video' | 'gif' | null>(null);
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [loadingGiphy, setLoadingGiphy] = useState(false);
  const isMobile = useIsMobile();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [open, setOpen] = useState(false);
  const [topTags, setTopTags] = useState<{ name: string; count: number }[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    if (showGifPicker && giphyResults.length === 0) {
      setLoadingGiphy(true);
      const randomOffset = Math.floor(Math.random() * 50);
      fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${import.meta.env.VITE_GIPHY_KEY}&limit=12&rating=pg&offset=${randomOffset}`)
        .then(res => res.json())
        .then(data => {
          setGiphyResults(data.data || []);
          setLoadingGiphy(false);
        })
        .catch(error => {
          console.error('Error loading trending GIFs:', error);
          setLoadingGiphy(false);
        });
    }
  }, [showGifPicker]);

  useEffect(() => {
    const fetchTopTags = async () => {
      try {
        const { data, error } = await supabase
          .from("tags")
          .select(`
            name,
            posts_tags (
              post_id
            )
          `)
          .eq("type", "post");

        if (error) throw error;

        const tagCounts = data.map(tag => ({
          name: tag.name,
          count: tag.posts_tags?.length || 0
        })).sort((a, b) => b.count - a.count);

        setTopTags(tagCounts);
      } catch (error) {
        console.error("Error fetching top tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTopTags();
  }, []);

  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) {
      toast.error(isRtl ? "يمكنك تحميل 2 صور كحد أقصى" : "You can upload maximum 2 images");
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isRtl ? `${file.name} - حجم الصورة يجب أن يكون أقل من 5 ميغابايت` : `${file.name} - Image size must be less than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMediaType('images');
      setSelectedGif(null);
      setVideos([]);
      setVideoPreview([]);
      setImages(prev => [...prev, ...validFiles]);

      Promise.all(
        validFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then(previews => setImagePreview(prev => [...prev, ...previews]));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 1) {
      toast.error(isRtl ? "يمكنك تحميل فيديو واحد كحد أقصى" : "You can upload maximum 1 video");
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(isRtl ? `${file.name} - حجم الفيديو يجب أن يكون أقل من 50 ميغابايت` : `${file.name} - Video size must be less than 50MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMediaType('video');
      setSelectedGif(null);
      setImages([]);
      setImagePreview([]);
      setVideos(validFiles);

      Promise.all(
        validFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then(previews => setVideoPreview(previews));
    }
  };

  const handleGifSelect = (gif: any) => {
    setSelectedGif(gif.images.original.url);
    setMediaType('gif');
    setImages([]);
    setImagePreview([]);
    setVideos([]);
    setVideoPreview([]);
    setShowGifPicker(false);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };

  const removeMedia = () => {
    setImages([]);
    setImagePreview([]);
    setVideos([]);
    setVideoPreview([]);
    setSelectedGif(null);
    setMediaType(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length === 0) {
        setMediaType(null);
      }
      return newImages;
    });

    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });

    setImagePreview(prev => {
      const newPreviews = [...prev];
      const [movedPreview] = newPreviews.splice(fromIndex, 1);
      newPreviews.splice(toIndex, 0, movedPreview);
      return newPreviews;
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = formatTag(tagInput);

      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !images.length && !videos.length && !selectedGif && !link) {
      toast.error(isRtl ? "يرجى كتابة محتوى أو إضافة وسائط أو رابط" : "Please write content or add media or a link");
      return;
    }

    try {
      console.log("Submitting post with content:", content.substring(0, 30) + "...");
      console.log("Media included:", mediaType ? "Yes" : "No");

      await createPost({
        content,
        images: mediaType === 'images' ? images : [],
        videos: mediaType === 'video' ? videos : [],
        gifUrl: mediaType === 'gif' ? selectedGif : null,
        link,
        tags
      });
      setContent("");
      setImages([]);
      setImagePreview([]);
      setVideos([]);
      setVideoPreview([]);
      setSelectedGif(null);
      setLink("");
      setMediaType(null);
      setTags([]);

      if (onPostCreated) {
        onPostCreated();
      }
      toast.success(t('editWindowAlert'));
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(isRtl ? "حدث خطأ أثناء نشر المنشور" : "Error publishing post");
    }
  };

  return (
    <Card className="border-border/40 bg-card/30 w-full mt-4">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Avatar className="h-10 w-10 border hidden sm:block">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Textarea
                placeholder={isRtl ? "ماذا يدور في ذهنك؟" : "What's on your mind?"}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-20 bg-[#000] text-[#200B2E] placeholder:text-[#200B2E]/60 dark:bg-[#000] dark:text-white dark:placeholder:text-white/60 focus-visible:ring-0 resize-none px-4 py-3"
                disabled={uploading}
                dir={isRtl ? "rtl" : "ltr"}
              />

              {showGifPicker && (
                <div className="mt-3 rounded-md overflow-hidden bg-background/95 p-4">
                  <div className="mb-3">
                    <Input
                      type="text"
                      placeholder={isRtl ? "ابحث عن GIF" : "Search GIFs"}
                      value={giphySearch}
                      onChange={(e) => {
                        setGiphySearch(e.target.value);
                        if (e.target.value.trim()) {
                          setLoadingGiphy(true);
                          fetch(`https://api.giphy.com/v1/gifs/search?api_key=${import.meta.env.VITE_GIPHY_KEY}&q=${encodeURIComponent(e.target.value)}&limit=20&rating=pg`)
                            .then(res => res.json())
                            .then(data => {
                              setGiphyResults(data.data || []);
                              setLoadingGiphy(false);
                            })
                            .catch(error => {
                              console.error('Error searching Giphy:', error);
                              setLoadingGiphy(false);
                            });
                        } else {
                          setLoadingGiphy(true);
                          const randomOffset = Math.floor(Math.random() * 50);
                          fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${import.meta.env.VITE_GIPHY_KEY}&limit=12&rating=pg&offset=${randomOffset}`)
                            .then(res => res.json())
                            .then(data => {
                              setGiphyResults(data.data || []);
                              setLoadingGiphy(false);
                            })
                            .catch(error => {
                              console.error('Error loading trending memes:', error);
                              setLoadingGiphy(false);
                            });
                        }
                      }}
                      className="mb-2 bg-background"
                      dir={isRtl ? "rtl" : "ltr"}
                    />
                    {loadingGiphy ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                        {giphyResults.map((gif) => (
                          <div
                            key={gif.id}
                            className="cursor-pointer hover:opacity-90"
                            onClick={() => handleGifSelect(gif)}
                          >
                            <img
                              src={gif.images.fixed_height_small.url}
                              alt={gif.title}
                              className="w-full h-20 object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {imagePreview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-end mt-3" dir={isRtl ? "rtl" : "ltr"}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeMedia}
                      disabled={uploading}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      {isRtl ? "إزالة الكل" : "Remove All"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" dir={isRtl ? "rtl" : "ltr"}>
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 opacity-90"
                            onClick={() => removeImage(index)}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 opacity-90"
                              onClick={() => moveImage(index, index - 1)}
                              disabled={uploading}
                            >
                              ↑
                            </Button>
                          )}
                          {index < imagePreview.length - 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 opacity-90"
                              onClick={() => moveImage(index, index + 1)}
                              disabled={uploading}
                            >
                              ↓
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videoPreview.length > 0 && (
                <div className="mt-3">
                  {videoPreview.map((preview, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden">
                      <video
                        src={preview}
                        controls
                        className="max-h-96 w-full rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                        onClick={removeMedia}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedGif && (
                <div className="relative mt-3 rounded-md overflow-hidden">
                  <img
                    src={selectedGif}
                    alt="Selected GIF"
                    className="max-h-64 w-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className={`absolute top-2 ${isRtl ? "right-2" : "left-2"} h-8 w-8 opacity-90`}
                    onClick={removeMedia}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className={`flex gap-2 mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {showLinkInput && (
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder={isRtl ? "أضف رابطاً" : "Add a link"}
                      value={link}
                      onChange={handleLinkChange}
                      className="w-full"
                      dir={isRtl ? "rtl" : "ltr"}
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>

              <div className="" dir={isRtl ? "rtl" : "ltr"}>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1 mt-2"
                    >
                      # {formatTagForDisplay(tag)}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {tagInput || (isRtl ? "اختر وسماً أو أضف وسماً جديداً..." : "Select or add a new tag...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder={isRtl ? "ابحث عن وسوم أو أضف وسماً جديداً..." : "Search tags or add a new one..."}
                        value={tagInput}
                        onValueChange={setTagInput}
                      />
                      <CommandEmpty>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            {isRtl ? "لم يتم العثور على وسوم" : "No tags found"}
                          </p>
                          {tagInput && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const formattedTag = formatTag(tagInput);
                                if (!tags.includes(formattedTag)) {
                                  setTags([...tags, formattedTag]);
                                }
                                setTagInput("");
                                setOpen(false);
                              }}
                            >
                              {isRtl ? "إضافة" : "Add"} #{formatTagForDisplay(tagInput)}
                            </Button>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {loadingTags ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : (
                          <>
                            {tagInput && !topTags.some(tag =>
                              tag.name.toLowerCase() === tagInput.toLowerCase()
                            ) && (
                                <CommandItem
                                  value={tagInput}
                                  onSelect={() => {
                                    const formattedTag = formatTag(tagInput);
                                    if (!tags.includes(formattedTag)) {
                                      setTags([...tags, formattedTag]);
                                    }
                                    setTagInput("");
                                    setOpen(false);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  {isRtl ? "إضافة" : "Add"} # {formatTagForDisplay(tagInput)}
                                </CommandItem>
                              )}
                            {topTags
                              .filter(tag =>
                                tag.name.toLowerCase().includes(tagInput.toLowerCase())
                              )
                              .map((tag) => (
                                <CommandItem
                                  key={tag.name}
                                  value={tag.name}
                                  onSelect={() => {
                                    const formattedTag = formatTag(tag.name);
                                    if (!tags.includes(formattedTag)) {
                                      setTags([...tags, formattedTag]);
                                    }
                                    setTagInput("");
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      tags.includes(formatTag(tag.name)) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({tag.count})
                                  </span>
                                  # {formatTagForDisplay(tag.name)}
                                </CommandItem>
                              ))
                            }
                          </>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className={`flex justify-between items-center mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    id="image-upload"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploading || showGifPicker || mediaType === 'video'}
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploading || showGifPicker || mediaType === 'video'}
                  >
                    <Image className="h-4 w-4" />
                    {isMobile ? '' : <span>{isRtl ? "إضافة صور" : "Add Images"}</span>}
                  </Button>

                  <input
                    type="file"
                    accept="video/*"
                    id="video-upload"
                    className="hidden"
                    onChange={handleVideoChange}
                    disabled={uploading || showGifPicker || mediaType === 'images' || mediaType === 'gif'}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => document.getElementById("video-upload")?.click()}
                    disabled={uploading || showGifPicker || mediaType === 'images' || mediaType === 'gif'}
                  >
                    <Video className="h-4 w-4" />
                    {isMobile ? '' : <span>{isRtl ? "إضافة فيديو" : "Add Video"}</span>}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    disabled={uploading || mediaType === 'images' || mediaType === 'video'}
                  >
                    <SmilePlus className="h-4 w-4" />
                    {isMobile ? '' : <span>{isRtl ? "إضافة GIF" : "Add GIF"}</span>}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    onClick={() => {
                      setShowLinkInput(!showLinkInput);
                      if (!showLinkInput) {
                        setLink(''); // Clear link when opening input
                      }
                    }}
                    disabled={uploading}
                  >
                    <LinkIcon className="h-4 w-4" />
                    {isMobile ? '' : <span>{isRtl ? "إضافة رابط" : "Add Link"}</span>}
                  </Button>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                  disabled={uploading || (!content.trim() && !images.length && !videos.length && !selectedGif && !link)}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      <span>{isRtl ? "جاري النشر..." : "Publishing..."}</span>
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{isRtl ? "نشر" : "Post"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

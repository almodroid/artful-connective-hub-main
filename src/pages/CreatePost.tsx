import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, X, Image, Send, Link as LinkIcon, GalleryHorizontalEnd, SmilePlus, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatTag, formatTagForDisplay } from '@/utils/tag-utils';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { GiphyFetch } from "@giphy/js-fetch-api";

const giphy = new GiphyFetch(import.meta.env.VITE_GIPHY_KEY || '');

export default function CreatePost() {
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[],
    image: null as File | null
  });

  // Tag input states
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [topTags, setTopTags] = useState<{ name: string; count: number }[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  // Media states
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
  const [showLinkInput, setShowLinkInput] = useState(false);
  const isMobile = useIsMobile();

  // Fetch top tags
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

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Redirect if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(t("enterPostTitle"));
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Implement post creation API call

      toast.success(t("postCreatedSuccess"));
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(t("errorCreatingPost"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          console.error('Error loading trending memes:', error);
          setLoadingGiphy(false);
        });
    }
  }, [showGifPicker]);

  return (
    <Layout>
      <div className="container max-w-2xl py-10" dir={isRtl ? "rtl" : "ltr"}>
        <h1 className="text-3xl font-bold mb-8">{t("createNewPost")}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              {t("title")}
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("enterTitle")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              {t("description")}
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("enterDescription")}
              rows={5}
            />
          </div>

          {/* Media Previews */}
          {imagePreview.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeMedia}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {isRtl ? "إزالة الكل" : "Remove All"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videoPreview.length > 0 && (
            <div className="relative rounded-md overflow-hidden">
              <video
                src={videoPreview[0]}
                controls
                className="max-h-96 w-full rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-90"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {selectedGif && (
            <div className="relative rounded-md overflow-hidden">
              <img
                src={selectedGif}
                alt="Selected GIF"
                className="max-h-64 w-full object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-90"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Media Buttons */}
          <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`} dir={isRtl ? "rtl" : "ltr"}>
            <input
              type="file"
              accept="image/*"
              id="image-upload"
              className="hidden"
              onChange={handleImageChange}
              multiple
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`gap-2 `}
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={showGifPicker || mediaType === 'video'}
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
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              onClick={() => document.getElementById("video-upload")?.click()}
              disabled={showGifPicker || mediaType === 'images' || mediaType === 'gif'}
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
              disabled={mediaType === 'images' || mediaType === 'video'}
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
                  setLink('');
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
              {isMobile ? '' : <span>{isRtl ? "إضافة رابط" : "Add Link"}</span>}
            </Button>
          </div>

          {/* Link Input */}
          {showLinkInput && (
            <div className="flex-1">
              <Input
                type="url"
                placeholder={isRtl ? "أضف رابطاً" : "Add a link"}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full"
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          )}

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

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              {t("tags")}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
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
                            if (!formData.tags.includes(formattedTag)) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, formattedTag]
                              }));
                            }
                            setTagInput("");
                            setOpen(false);
                          }}
                        >
                          {isRtl ? "إضافة" : "Add"} # {formatTagForDisplay(tagInput)}
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
                                if (!formData.tags.includes(formattedTag)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, formattedTag]
                                  }));
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
                                if (!formData.tags.includes(formattedTag)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    tags: [...prev.tags, formattedTag]
                                  }));
                                }
                                setTagInput("");
                                setOpen(false);
                              }}
                            >
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({tag.count})
                              </span>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.tags.includes(formatTag(tag.name)) ? "opacity-100" : "opacity-0"
                                )}
                              />
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



          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!formData.title.trim() && !images.length && !videos.length && !selectedGif && !link)}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>{isRtl ? "جاري النشر..." : "Publishing..."}</span>
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  <span>{isRtl ? "نشر" : "Post"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
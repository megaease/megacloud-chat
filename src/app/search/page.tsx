"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, MessageSquare, Calendar, User, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  matchedMessages: Array<{
    id: string;
    content: string;
    role: string;
    createdAt: string;
  }>;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
  success: boolean;
}

export default function SearchPage() {
  const t = useTranslations("Search");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query using useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Search query and browse all chats
  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery<SearchResponse>({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      // If no search query, fetch all chats
      if (!debouncedQuery.trim()) {
        const response = await fetch("/api/chats?limit=100", {
          headers: {
            userId: "user-id", // TODO: Get actual user ID from auth context
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await response.json();
        // Transform chats to search result format
        return {
          results: data.chats.map((chat: Chat) => ({
            id: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            matchedMessages: [], // No matched messages when browsing all
          })),
          query: "",
          total: data.chats.length,
          success: true,
        };
      }

      // Search with query
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(debouncedQuery)}`,
        {
          headers: {
            userId: "user-id", // TODO: Get actual user ID from auth context
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      return response.json();
    },
    enabled: true,
  });

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={`${part}-${index}`}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            {debouncedQuery ? t("searchResults") : t("title")}
          </h1>
          <p className="text-muted-foreground">
            {debouncedQuery ? t("searchResultsDescription") : t("description")}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {isLoading && debouncedQuery && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">{t("searching")}</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive">{t("searchFailed")}</p>
            </div>
          )}

          {searchResults && !isLoading && (
            <>
              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {debouncedQuery
                    ? t("foundResults", {
                        count: searchResults.total,
                        plural: searchResults.total !== 1 ? "s" : "",
                        query: debouncedQuery,
                      })
                    : t("showingResults", {
                        count: searchResults.total,
                        plural: searchResults.total !== 1 ? "s" : "",
                      })}
                </p>
              </div>

              {/* Results List */}
              {searchResults.results.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("noResults")}</h3>
                  <p className="text-muted-foreground">
                    {t("noResultsDescription")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.results.map((result) => (
                    <Card
                      key={result.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              <Link
                                href={`/chat/${result.id}`}
                                className="hover:text-primary transition-colors"
                              >
                                {highlightText(result.title, debouncedQuery)}
                              </Link>
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {t("updatedOn", {
                                  date: formatDate(result.updatedAt),
                                })}
                              </span>
                              {result.matchedMessages.length > 0 && (
                                <>
                                  <Separator
                                    orientation="vertical"
                                    className="h-3"
                                  />
                                  <span>
                                    {t("matchedMessages", {
                                      count: result.matchedMessages.length,
                                      plural:
                                        result.matchedMessages.length !== 1
                                          ? "s"
                                          : "",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      {result.matchedMessages.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {result.matchedMessages
                              .slice(0, 3)
                              .map((message) => (
                                <div
                                  key={message.id}
                                  className="border-l-2 border-muted pl-4 py-2"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {message.role === "user" ? (
                                      <User className="h-3 w-3" />
                                    ) : (
                                      <Bot className="h-3 w-3" />
                                    )}
                                    <Badge
                                      variant={
                                        message.role === "user"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {message.role === "user"
                                        ? t("you")
                                        : t("ai")}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(message.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {highlightText(
                                      message.content,
                                      debouncedQuery
                                    )}
                                  </p>
                                </div>
                              ))}
                            {result.matchedMessages.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                {t("moreMatches", {
                                  count: result.matchedMessages.length - 3,
                                })}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {!searchResults && !isLoading && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("startSearching")}
              </h3>
              <p className="text-muted-foreground">
                {t("startSearchingDescription")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

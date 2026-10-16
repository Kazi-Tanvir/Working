"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  UserPlus,
  Clock,
  Search,
  Shield,
  Activity,
  Tv,
  BookOpen,
  Gamepad2,
  Film,
  ExternalLink,
  Check,
  X,
  UserX,
  Sparkles,
  AlertTriangle,
  Loader2,
  Terminal,
} from "lucide-react";

interface Friend {
  friendshipId: string;
  connectedSince: string;
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  customBadge: string | null;
  totalEntries: number;
  completedCount: number;
  currentlyConsuming: {
    title: string;
    type: string;
    coverImage: string;
    status: string;
    progressCurrent: number;
    totalEpisodes: number | null;
    unit: string;
  } | null;
}

interface PendingRequest {
  requestId: string;
  sentAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    customBadge: string | null;
  };
}

interface SearchUserResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  customBadge: string | null;
  bio: string | null;
  totalEntries: number;
  relationship: "none" | "pending_sent" | "pending_received" | "accepted";
  friendshipId: string | null;
}

export default function FriendsHubPage() {
  const { user } = useAuth();
  const { isSignedIn, isLoaded } = useUser();
  const isAuthenticated = !!user || isSignedIn;

  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PendingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal preview state
  const [previewFriend, setPreviewFriend] = useState<Friend | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Friends List
  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/users/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error("Failed to load friends:", err);
    }
  }, []);

  // Fetch Pending Requests
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/users/friends/requests");
      if (res.ok) {
        const data = await res.json();
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated && isLoaded) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchFriends(), fetchRequests()]);
      setIsLoading(false);
    };

    loadData();
  }, [isAuthenticated, isLoaded, fetchFriends, fetchRequests]);

  // Debounced User Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Actions
  const handleSendRequest = async (targetUsername: string) => {
    try {
      const res = await fetch("/api/users/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`TRANSMISSION DISPATCHED // Request sent to @${targetUsername}`);
        // update search list locally
        setSearchResults((prev) =>
          prev.map((u) => (u.username === targetUsername ? { ...u, relationship: "pending_sent" } : u))
        );
        fetchRequests();
      } else {
        showToast(`ERROR: ${data.error || "Failed to dispatch request"}`);
      }
    } catch {
      showToast("ERROR: Network transmission failure");
    }
  };

  const handleAcceptRequest = async (requestId: string, username: string) => {
    try {
      const res = await fetch(`/api/users/friends/${requestId}/accept`, { method: "PUT" });
      if (res.ok) {
        showToast(`LINK ESTABLISHED // Connected with @${username}`);
        await Promise.all([fetchFriends(), fetchRequests()]);
      } else {
        const data = await res.json();
        showToast(`ERROR: ${data.error || "Acceptance failed"}`);
      }
    } catch {
      showToast("ERROR: Network error during acceptance");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/users/friends/${requestId}/reject`, { method: "PUT" });
      if (res.ok) {
        showToast("REQUEST PURGED // Incoming connection declined");
        fetchRequests();
      }
    } catch {
      showToast("ERROR: Failed to decline request");
    }
  };

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    if (!confirm(`Confirm removing friend @${username}?`)) return;
    try {
      const res = await fetch(`/api/users/friends/${friendshipId}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Friend @${username} removed`);
        fetchFriends();
        if (previewFriend?.friendshipId === friendshipId) {
          setPreviewFriend(null);
        }
      }
    } catch {
      showToast("ERROR: Failed to sever connection");
    }
  };

  if (!isAuthenticated && isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-mono">
        <div className="cyber-card p-8 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black">
          <Terminal className="w-12 h-12 text-cyber-yellow mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black uppercase text-white mb-2">
            ACCESS_RESTRICTED // AUTHENTICATION REQUIRED
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            The Friends Network and User Profiles are strictly available for signed-in ShinDB users.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-cyber-purple text-white font-extrabold uppercase text-xs border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5"
            >
              [SIGN IN]
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-white text-black font-extrabold uppercase text-xs border border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] hover:bg-gray-200"
            >
              [CREATE ACCOUNT]
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-mono select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white border-2 border-cyber-cyan px-4 py-2.5 shadow-[4px_4px_0px_0px_var(--cyber-cyan)] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Console Header */}
      <div className="cyber-card p-6 border-2 border-white shadow-[6px_6px_0px_0px_#ffffff] bg-black mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-purple/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[10px] tracking-widest text-cyber-green uppercase font-bold">
                FRIENDS_NETWORK // ONLINE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase flex items-center gap-3">
              <Users className="w-7 h-7 text-cyber-purple" />
              Friends Network
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Share libraries, view friend activity, and connect with other users.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="border border-white/20 bg-white/5 px-3 py-2 text-center">
              <span className="block text-[10px] text-gray-400 uppercase">Connected</span>
              <span className="text-base font-extrabold text-cyber-cyan">{friends.length}</span>
            </div>
            <div className="border border-white/20 bg-white/5 px-3 py-2 text-center">
              <span className="block text-[10px] text-gray-400 uppercase">Incoming</span>
              <span className={`text-base font-extrabold ${incomingRequests.length > 0 ? "text-cyber-red animate-pulse" : "text-gray-400"}`}>
                {incomingRequests.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6 border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "friends"
                ? "bg-white text-black border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-transparent text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>01 // Friends List ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "bg-cyber-purple text-white border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-transparent text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>02 // Requests</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-cyber-red text-white text-[10px] font-black border border-white">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "search"
                ? "bg-cyber-cyan text-black border-white shadow-[3px_3px_0px_0px_#ffffff]"
                : "bg-transparent text-gray-400 border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>03 // Find Friends</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="cyber-card p-12 text-center border-2 border-white">
          <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">
            LOADING FRIENDS...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: FRIENDS LIST */}
          {activeTab === "friends" && (
            <div>
              {friends.length === 0 ? (
                <div className="cyber-card p-12 text-center border-2 border-dashed border-white/30 bg-black">
                  <UserPlus className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-sm font-extrabold uppercase text-white mb-1">
                    NO FRIENDS CONNECTED YET
                  </h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto mb-5">
                    Your personal network is currently empty. Connect with friends using the Find Friends tab.
                  </p>
                  <button
                    onClick={() => setActiveTab("search")}
                    className="px-5 py-2 bg-cyber-purple text-white text-xs font-extrabold uppercase border border-white shadow-[3px_3px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
                  >
                    [FIND FRIENDS NOW]
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.map((friend) => (
                    <div
                      key={friend.friendshipId}
                      className="cyber-card p-5 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black hover:border-cyber-cyan transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header snippet */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-lg text-white overflow-hidden shadow-[2px_2px_0px_0px_#ffffff]">
                              {friend.avatarUrl ? (
                                <img
                                  src={friend.avatarUrl}
                                  alt={friend.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                friend.username.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-black text-white hover:text-cyber-cyan transition-colors">
                                <Link href={`/friends/${friend.username}`}>
                                  {friend.displayName}
                                </Link>
                              </div>
                              <div className="text-[11px] text-gray-400">@{friend.username}</div>
                            </div>
                          </div>
                          <span className="text-[9px] uppercase px-2 py-0.5 bg-white/10 text-cyber-green border border-cyber-green/40 font-bold">
                            LINKED
                          </span>
                        </div>

                        {/* Custom Badge */}
                        <div className="mb-3">
                          <span className="text-[10px] px-2 py-0.5 bg-black border border-white text-gray-300 font-bold tracking-wider">
                            {friend.customBadge || "[SYS_OPERATOR::RECRUIT]"}
                          </span>
                        </div>

                        {/* Bio if exists */}
                        {friend.bio && (
                          <p className="text-xs text-gray-400 line-clamp-2 italic mb-4 bg-white/5 p-2 border-l-2 border-cyber-purple">
                            "{friend.bio}"
                          </p>
                        )}

                        {/* Stats Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-center border-y border-white/10 py-2.5 mb-4 text-[11px]">
                          <div>
                            <span className="block text-gray-400 text-[9px] uppercase">TRACKED</span>
                            <span className="font-extrabold text-white">{friend.totalEntries} entries</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 text-[9px] uppercase">COMPLETED</span>
                            <span className="font-extrabold text-cyber-green">{friend.completedCount} completed</span>
                          </div>
                        </div>

                        {/* Currently Consuming preview */}
                        {friend.currentlyConsuming ? (
                          <div className="border border-white/20 bg-white/5 p-2.5 mb-4">
                            <span className="block text-[9px] tracking-widest text-cyber-yellow uppercase font-bold mb-1">
                              CURRENTLY CONSUMING:
                            </span>
                            <div className="flex items-center gap-2">
                              {friend.currentlyConsuming.coverImage ? (
                                <img
                                  src={friend.currentlyConsuming.coverImage}
                                  alt={friend.currentlyConsuming.title}
                                  className="w-8 h-10 object-cover border border-white"
                                />
                              ) : (
                                <div className="w-8 h-10 bg-black border border-white flex items-center justify-center text-[10px]">
                                  N/A
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="text-xs font-bold text-white truncate">
                                  {friend.currentlyConsuming.title}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Prog: {friend.currentlyConsuming.progressCurrent}
                                  {friend.currentlyConsuming.totalEpisodes
                                    ? ` / ${friend.currentlyConsuming.totalEpisodes}`
                                    : ""}{" "}
                                  {friend.currentlyConsuming.unit}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 italic mb-4">
                            No active media consumption recorded.
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Link
                          href={`/friends/${friend.username}`}
                          className="flex-1 py-1.5 bg-white text-black font-extrabold text-[11px] uppercase text-center border border-white hover:bg-cyber-cyan transition-all shadow-[2px_2px_0px_0px_#ffffff]"
                        >
                          [VIEW PROFILE]
                        </Link>
                        <button
                          onClick={() => setPreviewFriend(friend)}
                          className="px-2.5 py-1.5 border border-white/30 hover:border-white text-gray-300 text-[11px] uppercase hover:bg-white/10 transition-all cursor-pointer"
                          title="Quick Preview"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(friend.friendshipId, friend.username)}
                          className="px-2.5 py-1.5 border border-red-500/40 hover:border-red-500 text-red-400 hover:bg-red-500/10 text-[11px] uppercase transition-all cursor-pointer"
                          title="Remove Friend"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === "requests" && (
            <div className="space-y-8">
              {/* Incoming Requests Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-cyber-yellow animate-pulse" />
                  <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                    INCOMING FRIEND REQUESTS ({incomingRequests.length})
                  </h3>
                </div>

                {incomingRequests.length === 0 ? (
                  <div className="border border-white/20 p-6 text-center text-xs text-gray-500 bg-black">
                    NO PENDING FRIEND REQUESTS.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border border-white bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden">
                            {req.user.avatarUrl ? (
                              <img src={req.user.avatarUrl} alt={req.user.username} className="w-full h-full object-cover" />
                            ) : (
                              req.user.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">{req.user.displayName}</div>
                            <div className="text-xs text-gray-400">@{req.user.username}</div>
                            <span className="text-[9px] text-cyber-yellow">
                              Sent: {new Date(req.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req.requestId, req.user.username)}
                            className="px-3 py-1.5 bg-cyber-green text-black font-extrabold text-xs uppercase border border-white shadow-[2px_2px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ACCEPT</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.requestId)}
                            className="px-2.5 py-1.5 border border-white/30 hover:border-red-500 hover:text-red-400 text-gray-400 text-xs uppercase transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests Section */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-extrabold uppercase text-gray-400 tracking-wider">
                    OUTGOING FRIEND REQUESTS ({outgoingRequests.length})
                  </h3>
                </div>

                {outgoingRequests.length === 0 ? (
                  <div className="border border-white/20 p-6 text-center text-xs text-gray-500 bg-black">
                    NO OUTGOING FRIEND REQUESTS PENDING.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="p-4 border border-white/30 bg-white/5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 border border-white/40 bg-black flex items-center justify-center font-bold text-gray-300 overflow-hidden">
                            {req.user.avatarUrl ? (
                              <img src={req.user.avatarUrl} alt={req.user.username} className="w-full h-full object-cover" />
                            ) : (
                              req.user.username.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{req.user.displayName}</div>
                            <div className="text-[11px] text-gray-400">@{req.user.username}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-cyber-yellow border border-cyber-yellow/40 px-2 py-0.5">
                            DISPATCHED
                          </span>
                          <button
                            onClick={() => handleRemoveFriend(req.requestId, req.user.username)}
                            className="text-[10px] text-gray-400 hover:text-red-400 border border-white/20 px-2 py-0.5 uppercase cursor-pointer"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEARCH USERS */}
          {activeTab === "search" && (
            <div>
              {/* Search Console Input */}
              <div className="cyber-card p-4 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] bg-black mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-cyber-cyan" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH BY USERNAME OR DISPLAY NAME..."
                    className="w-full pl-9 pr-4 py-2.5 bg-black border-2 border-white text-white text-xs font-mono uppercase focus:outline-none focus:border-cyber-cyan placeholder-gray-500"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-4 w-4 text-cyber-cyan animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Search Results Display */}
              {searchQuery.trim().length >= 2 ? (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                    SEARCH RESULTS ({searchResults.length})
                  </div>

                  {searchResults.length === 0 && !isSearching ? (
                    <div className="border border-white/20 p-12 text-center text-xs text-gray-500 bg-black">
                      NO MATCHING USERS FOUND.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((target) => (
                        <div
                          key={target.id}
                          className="cyber-card p-4 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] bg-black flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 border border-white bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden shadow-[2px_2px_0px_0px_#ffffff]">
                                {target.avatarUrl ? (
                                  <img src={target.avatarUrl} alt={target.username} className="w-full h-full object-cover" />
                                ) : (
                                  target.username.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-black text-white">{target.displayName}</div>
                                <div className="text-xs text-gray-400">@{target.username}</div>
                              </div>
                            </div>

                            <div className="text-[10px] text-gray-300 font-bold mb-3">
                              {target.customBadge || "[SYS_OPERATOR::RECRUIT]"}
                            </div>

                            <div className="text-[11px] text-gray-400 border-t border-white/10 pt-2 mb-3">
                              Total Entries: <span className="font-extrabold text-white">{target.totalEntries}</span>
                            </div>
                          </div>

                          {/* Dynamic Action Button */}
                          <div>
                            {target.relationship === "accepted" ? (
                              <Link
                                href={`/friends/${target.username}`}
                                className="block w-full py-1.5 bg-cyber-green text-black font-extrabold text-xs uppercase text-center border border-white shadow-[2px_2px_0px_0px_#ffffff]"
                              >
                                [FRIENDS // VIEW PROFILE]
                              </Link>
                            ) : target.relationship === "pending_sent" ? (
                              <button
                                disabled
                                className="w-full py-1.5 bg-white/10 text-cyber-yellow font-bold text-xs uppercase border border-cyber-yellow/40 cursor-not-allowed"
                              >
                                [REQUEST PENDING]
                              </button>
                            ) : target.relationship === "pending_received" ? (
                              <button
                                onClick={() => setActiveTab("requests")}
                                className="w-full py-1.5 bg-cyber-yellow text-black font-extrabold text-xs uppercase border border-white shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer"
                              >
                                [RESPOND TO REQUEST]
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(target.username)}
                                className="w-full py-1.5 bg-white text-black font-extrabold text-xs uppercase border border-white hover:bg-cyber-purple hover:text-white transition-all shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>[+ ADD FRIEND]</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-white/20 p-8 text-center text-xs text-gray-500 bg-black">
                  ENTER AT LEAST 2 CHARACTERS TO SEARCH FOR USERS.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="cyber-card p-6 border-2 border-white shadow-[8px_8px_0px_0px_var(--cyber-cyan)] bg-black max-w-lg w-full relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPreviewFriend(null)}
              className="absolute top-4 right-4 p-1 border border-white/20 hover:border-white text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 border-2 border-white bg-cyber-purple/20 flex items-center justify-center font-black text-xl text-white overflow-hidden shadow-[3px_3px_0px_0px_#ffffff]">
                {previewFriend.avatarUrl ? (
                  <img src={previewFriend.avatarUrl} alt={previewFriend.username} className="w-full h-full object-cover" />
                ) : (
                  previewFriend.username.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{previewFriend.displayName}</h3>
                <div className="text-xs text-gray-400">@{previewFriend.username}</div>
                <span className="text-[10px] text-cyber-cyan font-bold">
                  {previewFriend.customBadge || "[SYS_OPERATOR::ELITE]"}
                </span>
              </div>
            </div>

            {previewFriend.bio && (
              <p className="text-xs text-gray-300 italic mb-4 bg-white/5 p-3 border-l-2 border-cyber-cyan">
                "{previewFriend.bio}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-center border-y border-white/10 py-3 mb-4 text-xs">
              <div>
                <span className="block text-gray-400 text-[10px] uppercase">Total Catalog</span>
                <span className="text-base font-extrabold text-white">{previewFriend.totalEntries}</span>
              </div>
              <div>
                <span className="block text-gray-400 text-[10px] uppercase">Completed</span>
                <span className="text-base font-extrabold text-cyber-green">{previewFriend.completedCount}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewFriend(null)}
                className="px-4 py-2 border border-white/30 text-gray-400 hover:text-white text-xs uppercase cursor-pointer"
              >
                [CLOSE]
              </button>
              <Link
                href={`/friends/${previewFriend.username}`}
                className="px-5 py-2 bg-cyber-cyan text-black font-extrabold text-xs uppercase border border-white shadow-[2px_2px_0px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5"
              >
                [VIEW FULL PROFILE →]
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

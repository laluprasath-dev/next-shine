import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { socialApi } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Grid, Heart, Bookmark } from "lucide-react";
import PostCardWrapper from "./PostCardWrapper";
import ProfileCard from "./ProfileCard";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import UserListModal from "./UserListModal";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch profile data
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      if (!username) throw new Error("Username is required");

      try {
        const { data, error } = await socialApi.profiles.getByUsername(
          username
        );
        if (error) throw error;
        return data;
      } catch (err) {
        // Try by ID if username fails
        const { data, error } = await socialApi.profiles.getById(username);
        if (error) throw error;
        return data;
      }
    },
    retry: 1,
  });

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !profile?.id) return;

      try {
        const { data, error } = await supabase
          .from("user_follows")
          .select()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle();

        if (!error && data) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowStatus();
  }, [user, profile?.id]);

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["profileStats", profile?.id],
    queryFn: () => socialApi.profiles.getStats(profile?.id || ""),
    enabled: !!profile?.id,
  });

  // Fetch posts by user
  const {
    data: posts,
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["userPosts", profile?.id, activeTab],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await socialApi.posts.getByUserId(profile.id);
      if (error) throw error;

      return data.map((post) => ({
        ...post,
        profile: {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
        },
        category: post.category as "Product" | "Vehicle" | "Experience" | null,
      }));
    },
    enabled: !!profile,
  });

  if (isProfileLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-sm-red" />
        </div>
      </Layout>
    );
  }

  if (profileError || !profile) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold">User not found</h2>
          <p className="mt-2 text-gray-500">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </Layout>
    );
  }

  const handleOpenFollowersModal = () => {
    setFollowersModalOpen(true);
  };

  const handleOpenFollowingModal = () => {
    setFollowingModalOpen(true);
  };
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
       
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <ProfileCard
            profile={profile}
            showFollow={true}
            isFollowing={isFollowing}
            stats={stats}
            onFollowersClick={handleOpenFollowersModal}
            onFollowingClick={handleOpenFollowingModal}
          />

          {/* Message Button (added externally if not part of ProfileCard) */}
          {user?.id !== profile.id && (
            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
              onClick={() => navigate(`/messenger/${profile.id}`)}
            >
              Message
            </button>
          )}
        </div>

        {/* Tabs for different content */}
        <Tabs defaultValue="posts" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center">
              <Grid className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Liked
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center">
              <Bookmark className="mr-2 h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {isPostsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-sm-red" />
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCardWrapper key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-lg font-medium">No posts yet</p>
                <p className="mt-2 text-gray-500">
                  This user hasn't posted anything.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            <div className="py-12 text-center">
              <p className="text-lg font-medium">Coming soon</p>
              <p className="mt-2 text-gray-500">
                Liked posts will appear here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="py-12 text-center">
              <p className="text-lg font-medium">Coming soon</p>
              <p className="mt-2 text-gray-500">
                Saved posts will appear here.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Followers Modal */}
        <UserListModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={profile.id}
          type="followers"
          title="Followers"
        />

        {/* Following Modal */}
        <UserListModal
          isOpen={followingModalOpen}
          onClose={() => setFollowingModalOpen(false)}
          userId={profile.id}
          type="following"
          title="Following"
        />
      </div>
    </Layout>
  );
};

export default UserProfile;

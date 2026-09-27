import { ExploreExperience } from "@/components/explore-experience";
import {
  exploreProjects,
  exploreStory,
  getArticlePreviews,
} from "@/lib/explore-content";
import { fetchPosts } from "@/lib/notion";

export default async function Home() {
  const posts = await fetchPosts();

  return (
    <ExploreExperience
      articles={getArticlePreviews(posts)}
      projects={exploreProjects}
      story={exploreStory}
    />
  );
}

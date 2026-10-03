import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "../data/site";
import { withBase } from "../lib/paths";
import type { APIContext } from "astro";

/**
 * An RSS feed with no entries is not a valid feed and readers drop the URL, so
 * the endpoint only makes sense alongside at least one published post. Delete
 * this file and the blog collection together if no blog is wanted.
 */
export async function GET(context: APIContext) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: site.name,
    description: site.tagline,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: withBase(`/blog/${post.id}/`),
    })),
    customData: "<language>en-gb</language>",
  });
}

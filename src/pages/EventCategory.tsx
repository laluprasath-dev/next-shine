
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import EventsGrid from "@/components/events/EventsGrid";
import EventCategories from "@/components/events/EventCategories";
import { getEventsByCategory, getEventCategories } from "@/integrations/supabase/modules/eventAppPage";

const EventCategory = () => {
  const { category } = useParams<{ category: string }>();
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["eventCategories"],
    queryFn: getEventCategories,
  });
  
  // Fetch events by category
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["eventsByCategory", category],
    queryFn: () => category ? getEventsByCategory(category) : [],
    enabled: !!category,
  });

  if (!category) {
    return null;
  }

  return (
    <Layout>
      <div className="container max-[769px]:px-3 py-6 md:py-12">
        <div className="mb-5 md:mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-6">{category} Events</h1>
          <p className="text-gray-600 max-w-3xl">
            Explore all of our {category.toLowerCase()} events. From exciting upcoming events to memorable past events.
          </p>
        </div>
        
        {/* Categories */}
        <EventCategories categories={categories} className="mb-5 md:mb-8" />
        
        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div>
            {events.length > 0 ? (
              <EventsGrid events={events} />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-medium text-gray-600">No events found in this category</h3>
                <p className="text-gray-500 mt-2">Check back later for upcoming {category} events</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventCategory;

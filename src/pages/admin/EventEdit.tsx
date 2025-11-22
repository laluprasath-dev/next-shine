
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import EventForm from "@/components/admin/EventForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getEventById, 
  updateEvent, 
  EventFormData 
} from "@/integrations/supabase/modules/events";
import { useToast } from "@/hooks/use-toast";

const EventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch event data
  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: () => id ? getEventById(id) : null,
    enabled: !!id,
  });

  // Update event mutation
  const mutation = useMutation({
    mutationFn: (data: EventFormData) => {
      if (!id) throw new Error("Event ID is required");
      return updateEvent(id, data);
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/admin/events");
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: EventFormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Edit Event" backLink="/admin/events">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !event) {
    return (
      <AdminLayout title="Edit Event" backLink="/admin/events">
        <div className="text-center py-8 text-red-500">
          Error loading event. Please try again.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit Event: ${event.title}`} backLink="/admin/events">
      <div className="mb-6">
        <p className="text-gray-600">
          Update the event details below. Required fields are marked with an asterisk (*).
        </p>
      </div>

      <EventForm 
        initialData={event}
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </AdminLayout>
  );
};

export default EventEdit;

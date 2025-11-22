
import React from "react";
import { Calendar, MapPin, Tag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  id: string;
  title: string;
  category: string;
  start_date: string;
  end_date?: string;
  venue?: string;
  city?: string;
  banner_image_url?: string;
  tags?: string[];
  registration_required?: boolean;
  max_participants?: number;
  className?: string;
}

const EventCard = ({
  id,
  title,
  category,
  start_date,
  end_date,
  venue,
  city,
  banner_image_url,
  tags,
  registration_required,
  max_participants,
  className
}: EventCardProps) => {
  const formattedDate = new Date(start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  const location = venue && city ? `${venue}, ${city}` : venue || city || 'TBA';
  
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      <Link to={`/events/${id}`}>
        <div className="relative h-48 overflow-hidden">
          <img 
            src={banner_image_url || '/placeholder.svg'} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-sm-red hover:bg-sm-red text-white">
              {category}
            </Badge>
          </div>
          <div className="absolute top-3 right-3 text-[14px] bg-black bg-opacity-70 text-white font-medium p-1 rounded-md">
            {formattedDate}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{title}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {new Date(start_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              {end_date && end_date !== start_date && ` - ${new Date(end_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}`}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="line-clamp-1">{location}</span>
          </div>
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {registration_required && (
            <div className="flex items-center text-sm text-muted-foreground mt-auto">
              <Users className="w-4 h-4 mr-1" />
              <span>{max_participants ? `Limited to ${max_participants} participants` : 'Registration required'}</span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default EventCard;

export interface Author {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    photo_url: string;
    diet_profile: string | null;
}

export interface Announcement {
    id: string;
    cafe_id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    active_until: string;
    tags: string[];
    author: Author;
    interactions: any[];
}

export interface AnnouncementsResponse {
    items: Announcement[];
    total: number;
    page: number;
    size: number;
    pages: number;
    links: {
        first: string;
        last: string;
        self: string;
        next: string | null;
        prev: string | null;
    };
}

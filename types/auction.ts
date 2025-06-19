export interface User {
    _id: string;
    id: string;
    email: string;
    name: string;
    phone?: string;
    roles: string[];
    avatar?: string;
    campus: string;
    createdAt: Date | string;
}

export interface Item {
    _id: string;
    id: string;
    title: string;
    description: string;
    images: string[];
    category: string;
    condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
    startingprice: number;
    currentprice: number;
    startdate: Date | string;
    enddate: Date | string;
    seller?: User | string;
    status: 'Active' | 'Ended' | 'Sold' | 'Cancelled';
    bids: Bid[];
    campus: string;
    createdAt: Date | string;
}

export interface Bid {
    id: string;
    item: string;
    bidder?: User | string;
    amount: number;
    createdAt: Date | string;
}

export interface Message {
    _id: string;
    id: string;
    senderId: string;
    sender: string;
    receiverId: string;
    receiver: string;
    itemId?: string;
    content: string;
    read: boolean;
    createdAt: string;
}

export interface Conversation {
    _id: string;
    id: string;
    participants: User[] | string[];
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'bid' | 'message' | 'auction_end' | 'outbid';
    title: string;
    message: string;
    read: boolean;
    itemId?: string;
    createdAt: string;
}
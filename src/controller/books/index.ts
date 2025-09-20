import { PrismaClient } from '@prisma/client';
import { SuccessResponse } from '../../helpers/api-response';
import axios from 'axios';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

const fetchBooks = async (req: Request, res: Response) => {
    const { page = 1, search = '', sort = 'new' } = req.query;
    try {
        let apiUrl = 'https://openlibrary.org/search.json';
        let params: any = {
            page: page.toString(),
            limit: '20'
        };

        // Open Library API search and sort options
        if (search && search.toString().trim()) {
            params.q = search.toString().trim();
        } else {
            // Default search for popular books if no search query
            params.q = 'subject:fiction';
        }

        // Sort options for Open Library API
        // Available sorts: new, old, random, key, title, rating
        const validSorts = ['new', 'old', 'random', 'title', 'rating'];
        if (validSorts.includes(sort.toString())) {
            params.sort = sort.toString();
        }

        const response = await axios.get(apiUrl, { params });

        // Validate response
        if (!response.data || !response.data.docs || !Array.isArray(response.data.docs)) {
            throw new Error('Invalid response format from Open Library API');
        }

        // Transform and store book data
        const transformedBooks = await Promise.all(
            response.data.docs.slice(0, 20).map(async (book: any) => {
                // Skip books without title
                if (!book.title) {
                    return null;
                }

                // Extract and validate book ID
                let bookId: number;
                if (book.key && book.key.includes('/works/')) {
                    const keyMatch = book.key.match(/\/works\/OL(\d+)W/);
                    bookId = keyMatch ? parseInt(keyMatch[1]) : Math.floor(Math.random() * 1000000);
                } else if (book.edition_key && book.edition_key[0]) {
                    // Try to extract numeric ID from edition key
                    const editionMatch = book.edition_key[0].match(/\d+/);
                    bookId = editionMatch ? parseInt(editionMatch[0]) : Math.floor(Math.random() * 1000000);
                } else {
                    // Generate a unique ID based on title hash
                    bookId = Math.abs(book.title.split('').reduce((a: number, b: string) => {
                        a = ((a << 5) - a) + b.charCodeAt(0);
                        return a & a;
                    }, 0));
                }

                // Ensure bookId is a valid positive integer
                if (!bookId || bookId <= 0) {
                    bookId = Math.floor(Math.random() * 1000000) + 1;
                }

                // Check if book already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { 
                        apiId: bookId
                    }
                });

                if (!existingMedia) {
                    try {
                        // Create new media entry
                        existingMedia = await prisma.media.create({
                            data: {
                                apiId: bookId,
                                title: book.title || 'Unknown Title',
                                description: book.first_sentence?.[0] || book.subtitle || 'No description available',
                                genres: book.subject?.slice(0, 5) || [],
                                image: book.cover_i ? 
                                    `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : 
                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCA0IDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCYWNrZ3JvdW5kIC0tPgogIDxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjVmNWY1IiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMiIvPgogIAogIDwhLS0gQm9vayBJY29uIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc1LCAxMjApIj4KICAgIDwhLS0gQm9vayBDb3ZlciAtLT4KICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTgwIiBmaWxsPSIjOEI0NTEzIiByeD0iOCIvPgogICAgPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTMwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI0EwNTIyRCIgcng9IjQiLz4KICAgIAogICAgPCEtLSBCb29rIFNwaW5lIC0tPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzY1NDMyMSIgcng9IjggMCAwIDgiLz4KICAgIAogICAgPCEtLSBCb29rIFBhZ2VzIC0tPgogICAgPHJlY3QgeD0iMTQwIiB5PSI1IiB3aWR0aD0iMTAiIGhlaWdodD0iMTcwIiBmaWxsPSIjZmZmZmZmIiByeD0iMCA0IDQgMCIvPgogICAgPHJlY3QgeD0iMTM1IiB5PSI4IiB3aWR0aD0iMTAiIGhlaWdodD0iMTY0IiBmaWxsPSIjZjhmOGY4IiByeD0iMCAyIDIgMCIvPgogICAgCiAgICA8IS0tIFF1ZXN0aW9uIE1hcmsgLS0+CiAgICA8Y2lyY2xlIGN4PSI3NSIgY3k9IjcwIiByPSIyNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC45Ii8+CiAgICA8dGV4dCB4PSI3NSIgeT0iODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM4QjQ1MTMiPj88L3RleHQ+CiAgPC9nPgogIAogIDwhLS0gVGV4dCAtLT4KICA8dGV4dCB4PSIxNTAiIHk9IjM0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iNTAwIiBmaWxsPSIjNjY2NjY2Ij5ObyBDb3ZlciBBdmFpbGFibGU8L3RleHQ+CiAgPHRleHQgeD0iMTUwIiB5PSIzNjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSI+Qm9vayBJbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==',
                                type: 'BOOK',
                                meta: {
                                    author_name: book.author_name || [],
                                    first_publish_year: book.first_publish_year,
                                    publisher: book.publisher?.slice(0, 3) || [],
                                    isbn: book.isbn?.[0] || null,
                                    page_count: book.number_of_pages_median || null,
                                    language: book.language?.[0] || 'en',
                                    rating_average: book.ratings_average || null,
                                    rating_count: book.ratings_count || null,
                                    want_to_read_count: book.want_to_read_count || null,
                                    currently_reading_count: book.currently_reading_count || null,
                                    already_read_count: book.already_read_count || null,
                                    open_library_key: book.key || null
                                }
                            }
                        });
                    } catch (createError) {
                        console.error('Error creating book:', createError);
                        // If creation fails due to duplicate apiId, try to find existing
                        existingMedia = await prisma.media.findFirst({
                            where: { apiId: bookId }
                        });
                    }
                }

                return existingMedia;
            })
        );

        // Filter out null results
        const validBooks = transformedBooks.filter(book => book !== null);

        // Open Library doesn't provide exact pagination info, so we estimate
        const currentPageNum = parseInt(page.toString());
        const hasNextPage = response.data.docs.length === 20; // If we got full page, assume more exist
        const hasPrevPage = currentPageNum > 1;

        res.json(SuccessResponse('Books fetched successfully', {
            data: validBooks,
            pagination: {
                currentPage: currentPageNum,
                totalPages: null, // Open Library doesn't provide total pages
                hasNextPage,
                hasPrevPage,
                totalResults: response.data.numFound || null
            }
        }));
    } catch (error) {
        console.error('Error fetching books:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
            success: false,
            error: 'Error fetching book data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const fetchBookById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Try to get book details from Open Library
        const response = await axios.get(`https://openlibrary.org/works/OL${id}W.json`);
        
        // Get additional details
        const editionsResponse = await axios.get(`https://openlibrary.org/works/OL${id}W/editions.json`);
        
        const bookData = {
            ...response.data,
            editions: editionsResponse.data.entries?.slice(0, 5) || []
        };

        res.json(SuccessResponse('Book details fetched successfully', bookData));
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).json({ error: 'Error fetching book details' });
    }
};

export { fetchBooks, fetchBookById };
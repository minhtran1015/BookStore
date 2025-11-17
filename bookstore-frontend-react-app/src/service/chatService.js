import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "your_gemini_api_key_here"; // Get from environment variable
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getChatResponse = async (messages, booksContext = []) => {
  try {
    // Tạo system message với books context
    const systemMessage = `You are a multilingual book recommendation assistant for our online bookstore. You MUST ONLY recommend books that are currently in our inventory. Here is our complete inventory:

${booksContext.map(book => `
Book Details:
- Title: ${book.productName}
- Category: ${book.productCategory}
- Price: $${book.price}
- Description: ${book.description}
- Available: ${book.availableItemCount} copies
- Rating: ${book.averageRating}/5 (${book.noOfRatings} ratings)
${book.reviews && book.reviews.length > 0 ? `
Recent Reviews:
${book.reviews.slice(0, 3).map(review => `
  * ${review.userName} rated ${review.ratingValue}/5: "${review.reviewMessage}"
`).join('\n')}` : ''}
---`).join('\n')}

IMPORTANT RULES:
1. You MUST ONLY recommend books from the above inventory list
2. You can respond in any language the user uses (English, Vietnamese, etc.)
3. If a user asks about a book not in our inventory, respond with: "I apologize, but that book is not currently in our inventory. However, I can recommend some similar books we do have in stock." (in the user's language)
4. NEVER make up or hallucinate books that aren't in our inventory
5. If you're unsure about a book, say: "Let me check our inventory for that specific book." (in the user's language)
6. Be friendly and professional
7. When recommending books, explain why they match the user's interests
8. Include price and availability information in your recommendations
9. If we don't have books matching the user's request, be honest about it
10. Match the user's language in your responses
11. Keep responses concise and focused on our available books
12. If the user switches languages, follow their language choice
13. Consider book ratings and number of ratings when making recommendations
14. Mention if a book is highly rated or has many ratings
15. Use customer reviews to provide more detailed recommendations
16. When discussing a book, mention relevant customer reviews that highlight its strengths

Your primary goal is to help users find books from our current inventory that match their interests and needs, while communicating in their preferred language.`;

    // Gộp system message và các message user gửi
    const userMessages = messages.map(msg => msg.text).join('\n');
    const prompt = `${systemMessage}\n\nUser: ${userMessages}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini AI:", error);
    throw error;
  }
}; 
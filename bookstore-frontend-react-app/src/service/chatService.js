import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyAOmcjeJxqpzOxMqxaiSFiwHyHQwAJRvo8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getChatResponse = async (messages, booksContext = [], userOrdersContext = null, userCartContext = null) => {
  try {
    console.log('🤖 ChatService: Starting chat request...');
    console.log('📝 Messages:', messages);
    console.log('📚 Books context count:', booksContext.length);
    console.log('🔑 API Key exists:', !!GEMINI_API_KEY);
    
    // Tạo phần thông tin đơn hàng nếu có
    const ordersInfo = userOrdersContext ? `

USER'S ORDER INFORMATION:
${userOrdersContext.isLoggedIn ? `
User is logged in. They have ${userOrdersContext.orders?.length || 0} order(s).

${userOrdersContext.orders && userOrdersContext.orders.length > 0 ? `
Order History:
${userOrdersContext.orders.map(order => `
- Order ID: ${order.orderId}
- Date: ${new Date(order.createdAt).toLocaleDateString()}
- Status: ${order.orderStatus}
- Total: $${order.totalOrderAmount}
- Items: ${order.orderItemResponseList?.map(item => `${item.productName} (${item.orderItemQty}x)`).join(', ')}
- Shipping Address: ${order.shippingAddress?.addressLine1 || 'N/A'}
- Payment Method: ${order.paymentMethod?.paymentType || 'N/A'}
`).join('\n')}` : 'No orders yet.'}
` : `
User is NOT logged in. To view or place orders, they need to sign in.
`}

RULES FOR HANDLING ORDER QUERIES:
1. If user asks about orders and is NOT logged in, politely inform them to sign in first
2. If user asks about order status, provide the current status from their order history
3. If user asks how to place an order, guide them through: Browse books → Add to cart → Checkout → Payment
4. Explain shipping and delivery information if asked
5. For order tracking, explain they can check their profile page for order details
6. If user wants to cancel/modify an order, explain they need to contact customer support
7. Provide helpful information about return policy if asked
8. Answer questions about payment methods accepted
` : '';

    // Tạo phần thông tin giỏ hàng nếu có
    const cartInfo = userCartContext ? `

USER'S SHOPPING CART INFORMATION:
${userCartContext.isLoggedIn ? `
User is logged in. They have ${userCartContext.cartItems?.length || 0} item(s) in their cart.
Total cart value: $${userCartContext.totalAmount?.toFixed(2) || '0.00'}

${userCartContext.cartItems && userCartContext.cartItems.length > 0 ? `
Cart Items:
${userCartContext.cartItems.map(item => `
- ${item.productName || 'Unknown Product'}
  Quantity: ${item.quantity}x
  Price per unit: $${item.price}
  Subtotal: $${(item.price * item.quantity).toFixed(2)}
`).join('\n')}` : 'Cart is empty.'}
` : `
User is NOT logged in. To view or manage cart, they need to sign in.
`}

RULES FOR HANDLING CART QUERIES:
1. If user asks about cart and is NOT logged in, politely inform them to sign in first
2. Show the number of items, item names, quantities, and total when asked about cart
3. If cart is empty, suggest browsing our book collection
4. Guide users to cart page to modify quantities or remove items
5. Explain users can proceed to checkout from cart page when ready
6. If user asks about adding to cart, explain they need to browse books and click "Add to Cart"
7. Remind users about free shipping threshold ($50) if cart value is close
8. Suggest related or popular books if user is shopping
` : '';

    // Tạo system message với books context, orders context và cart context
    const systemMessage = `You are a multilingual book recommendation assistant and customer service chatbot for our online bookstore. 

INVENTORY INFORMATION:
Here is our complete book inventory:

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
${ordersInfo}
${cartInfo}

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

CUSTOMER SERVICE CAPABILITIES:
- Help users find books based on their preferences
- Answer questions about ordering process, shipping, payment methods
- Provide order status information if user is logged in
- Guide users through the checkout process
- Explain return and refund policies
- Answer FAQs about account management

HOW TO PLACE AN ORDER:
1. Browse books or search for specific titles
2. Add desired books to shopping cart
3. Review cart and proceed to checkout
4. Enter/select shipping address
5. Choose payment method
6. Review order summary and confirm
7. Order will be processed and shipped

SHIPPING & DELIVERY:
- Standard shipping: 5-7 business days
- Express shipping: 2-3 business days
- Free shipping on orders over $50

PAYMENT METHODS:
- Credit/Debit cards (Visa, Mastercard, Amex)
- PayPal
- Cash on delivery (for eligible regions)

Your primary goal is to help users find books from our current inventory, answer their order-related questions, and provide excellent customer service, while communicating in their preferred language.`;

    // Gộp system message và các message user gửi
    const userMessages = messages.map(msg => msg.text).join('\n');
    const prompt = `${systemMessage}\n\nUser: ${userMessages}`;

    // Sử dụng gemini-2.0-flash - stable model hỗ trợ generateContent
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });
    console.log('🚀 Sending request to Gemini API with model: gemini-2.0-flash');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('✅ Response received:', responseText.substring(0, 100) + '...');
    return responseText;
  } catch (error) {
    console.error("❌ Error calling Gemini AI:", error);
    console.error("Error details:", error.message);
    console.error("Error response:", error.response?.data);
    
    // Fallback response khi API lỗi
    const userMessage = messages[messages.length - 1]?.text.toLowerCase() || '';
    
    // Phản hồi dựa trên từ khóa trong tin nhắn
    if (userMessage.includes('order') || userMessage.includes('đơn hàng')) {
      return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Để kiểm tra đơn hàng, bạn có thể:\n\n1. Vào trang Profile để xem lịch sử đơn hàng\n2. Liên hệ bộ phận CSKH qua email: support@bookstore.com\n3. Gọi hotline: 1900-xxxx\n\nCảm ơn bạn đã thông cảm! 🙏";
    } else if (userMessage.includes('book') || userMessage.includes('sách')) {
      const bookRecommendations = booksContext.slice(0, 3).map(book => 
        `📚 ${book.productName}\n   - Giá: $${book.price}\n   - Đánh giá: ${book.averageRating}/5 ⭐\n   - ${book.description.substring(0, 100)}...`
      ).join('\n\n');
      
      return `Xin lỗi, AI chatbot tạm thời gặp sự cố. Đây là một số sách nổi bật trong kho:\n\n${bookRecommendations}\n\nBạn có thể tìm kiếm thêm trên trang chủ! 📖`;
    } else {
      return "Xin lỗi, tôi đang gặp sự cố kỹ thuật tạm thời. Vui lòng:\n\n1. Thử lại sau vài phút\n2. Liên hệ CSKH: support@bookstore.com\n3. Duyệt xem sách trực tiếp trên website\n\nCảm ơn bạn! 😊";
    }
  }
};
import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getChatResponse } from '../service/chatService';
import { fetchBooks, fetchProductReviews } from '../service/bookService';
import '../BookChatbot.css';

const BOT_NAME = 'BookBot';
const USER_NAME = 'You';
const LOCAL_KEY = 'bookstore_chatbot_context';
const MAX_CONTEXT_MESSAGES = 20;

/** Messenger SVG icon */
const MessengerIcon = () => (
  React.createElement('svg', {
    width: 28, height: 28, viewBox: '0 0 36 36', fill: 'none', xmlns: 'http://www.w3.org/2000/svg',
    style: { display: 'block' }
  },
    React.createElement('circle', { cx: 18, cy: 18, r: 18, fill: '#0084FF' }),
    React.createElement('path', {
      d: 'M9.5 23.5L15.5 16.5L20.5 20.5L26.5 13.5L20.5 19.5L15.5 15.5L9.5 23.5Z',
      fill: 'white', stroke: 'white', strokeWidth: 1.5, strokeLinejoin: 'round'
    })
  )
);

const BookChatbot = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? JSON.parse(saved) : [
      { 
        sender: BOT_NAME, 
        text: 'Hello! I\'m your personal book advisor. I can help you find books from our current inventory. What kind of books are you interested in?' 
      }
    ];
  });
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState({});
  const chatEndRef = useRef(null);

  // Get user login status from Redux store
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const allBooks = await fetchBooks();
        setBooks(allBooks);

        // Fetch reviews for each book
        const reviewsPromises = allBooks.map(async (book) => {
          try {
            const bookReviews = await fetchProductReviews(book.productId);
            return { [book.productId]: bookReviews };
          } catch (error) {
            console.error(`Error fetching reviews for book ${book.productId}:`, error);
            return { [book.productId]: [] };
          }
        });

        const reviewsResults = await Promise.all(reviewsPromises);
        const reviewsMap = reviewsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setReviews(reviewsMap);
      } catch (error) {
        console.error('Error loading books:', error);
      }
    };

    const loadUserData = async () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const cartData = await getCartDetailsApi();
          setCartItems(cartData.cartItems || []);

          const ordersData = await getAllMyOrdersApi();
          setOrderHistory(ordersData || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadBooks();
    loadUserData();
  }, []);

  // Load user orders when logged in
  useEffect(() => {
    const loadUserOrders = async () => {
      if (userInfo) {
        try {
          const orders = await getAllMyOrdersApi();
          setUserOrders({
            isLoggedIn: true,
            orders: orders
          });
        } catch (error) {
          console.error('Error loading user orders:', error);
          setUserOrders({
            isLoggedIn: true,
            orders: []
          });
        }
      } else {
        setUserOrders({
          isLoggedIn: false,
          orders: []
        });
      }
    };
    loadUserOrders();
  }, [userInfo]);

  // Load user cart when logged in
  useEffect(() => {
    const loadUserCart = async () => {
      if (userInfo) {
        try {
          const cartData = await getCartDetailsApi();
          setUserCart({
            isLoggedIn: true,
            cartItems: cartData.cartItems || [],
            totalAmount: cartData.cartItems?.reduce((sum, item) => 
              sum + (item.price * item.quantity), 0) || 0
          });
        } catch (error) {
          console.error('Error loading user cart:', error);
          setUserCart({
            isLoggedIn: true,
            cartItems: [],
            totalAmount: 0
          });
        }
      } else {
        setUserCart({
          isLoggedIn: false,
          cartItems: [],
          totalAmount: 0
        });
      }
    };
    loadUserCart();
  }, [userInfo]);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: USER_NAME, text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const booksContext = books.map(book => ({
        productName: book.productName,
        productCategory: book.productCategory,
        price: book.price,
        description: book.description,
        availableItemCount: book.availableItemCount,
        averageRating: book.averageRating,
        noOfRatings: book.noOfRatings,
        reviews: reviews[book.productId] || []
      }));

      const botReply = await getChatResponse([...messages, userMsg], booksContext);
      setMessages((msgs) => [...msgs, { sender: BOT_NAME, text: botReply }]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      let errorMessage = 'Sorry, I\'m having trouble connecting. Please try again later.';

      if (error.response?.status === 400) {
        errorMessage = 'Sorry, I couldn\'t process your request. Please try rephrasing your question.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sorry, there was an authentication error. Please contact support.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Sorry, I\'m getting too many requests. Please try again in a few minutes.';
      }

      setMessages((msgs) => [...msgs, {
        sender: BOT_NAME,
        text: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setShowConfirmModal(true);
  };

  const confirmClearHistory = () => {
    const initialMessage = {
      sender: BOT_NAME,
      text: 'Hello! I\'m your personal book advisor and customer service assistant. I can help you:\n\n📚 Find and recommend books from our inventory\n📦 Answer questions about orders and shipping\n💳 Explain our ordering process and payment methods\n🔍 Check your order status (if logged in)\n\nWhat can I help you with today?'
    };
    setMessages([initialMessage]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify([initialMessage]));
    setShowConfirmModal(false);
  };

  // Format bot message để hiển thị đẹp hơn
  const formatBotMessage = (text) => {
    if (!text) return text;
    
    // Convert markdown-style formatting
    let formatted = text
      // Bold text **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic text *text* or _text_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Bullet points starting with - or * or •
      .replace(/^[\-\*•]\s+(.+)$/gm, '<li>$1</li>')
      // Numbered lists
      .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
      // Headers
      .replace(/^#{1,3}\s+(.+)$/gm, '<strong>$1</strong><br/>')
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, '</p><p>')
      // Single line breaks
      .replace(/\n/g, '<br/>');
    
    // Wrap consecutive <li> tags in <ul>
    formatted = formatted.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    // Wrap in paragraph if not already wrapped
    if (!formatted.startsWith('<')) {
      formatted = '<p>' + formatted + '</p>';
    } else if (!formatted.startsWith('<p>') && !formatted.startsWith('<ul>') && !formatted.startsWith('<strong>')) {
      formatted = '<p>' + formatted + '</p>';
    }
    
    return formatted;
  };

  const cancelClearHistory = () => {
    setShowConfirmModal(false);
  };

  return React.createElement('div', { className: `book-chatbot-widget${open ? ' open' : ''}${expanded ? ' expanded' : ''}` },
    open ? React.createElement('div', { className: 'book-chatbot-box' },
      React.createElement('div', { className: 'book-chatbot-header' },
        React.createElement('div', { className: 'book-chatbot-header-left' },
          React.createElement('span', { className: 'book-chatbot-avatar' }, '🤖'),
          React.createElement('span', { className: 'book-chatbot-title' }, 'BookBot')
        ),
        React.createElement('div', { className: 'book-chatbot-header-buttons' },
          React.createElement('button', {
            className: 'book-chatbot-expand',
            onClick: () => setExpanded(!expanded),
            title: expanded ? 'Minimize' : 'Maximize'
          }, expanded ? '🗗' : '🗖'),
          React.createElement('button', {
            className: 'book-chatbot-clear',
            onClick: handleClearHistory,
            title: 'Clear chat history'
          }, '🗑️'),
          React.createElement('button', {
            className: 'book-chatbot-close',
            onClick: () => setOpen(false),
            title: 'Close chat'
          }, '×')
        )
      ),
      React.createElement('div', { className: 'book-chatbot-messages' },
        messages.map((msg, idx) => React.createElement('div', {
          key: idx,
          className: `book-chatbot-msg ${msg.sender === USER_NAME ? 'user' : 'bot'}`
        },
          React.createElement('div', { className: 'book-chatbot-msg-content' },
            React.createElement('b', null, `${msg.sender}:`),
            ' ',
            msg.sender === BOT_NAME 
              ? React.createElement('span', { 
                  dangerouslySetInnerHTML: { __html: formatBotMessage(msg.text) } 
                })
              : msg.text
          )
        )),
        loading && React.createElement('div', { className: 'book-chatbot-msg bot' },
          React.createElement('div', { className: 'book-chatbot-msg-content' },
            React.createElement('b', null, `${BOT_NAME}:`),
            ' ',
            React.createElement('span', { className: 'book-chatbot-typing' }, 'Typing...')
          )
        ),
        messages.length > MAX_CONTEXT_MESSAGES && React.createElement('div', {
          className: 'book-chatbot-msg bot book-chatbot-warning'
        },
          React.createElement('i', null, `Note: Only the last ${MAX_CONTEXT_MESSAGES} messages are used to maintain context.`)
        ),
        React.createElement('div', { ref: chatEndRef })
      ),
      React.createElement('form', {
        className: 'book-chatbot-input-area',
        onSubmit: handleSend
      },
        React.createElement('input', {
          type: 'text',
          value: input,
          onChange: e => setInput(e.target.value),
          placeholder: 'Ask about books...',
          disabled: loading,
          autoFocus: true
        }),
        React.createElement('button', {
          type: 'submit',
          disabled: loading || !input.trim()
        }, 'Send')
      )
    ) : React.createElement('button', {
      className: 'book-chatbot-fab book-chatbot-messenger-fab',
      onClick: () => setOpen(true)
    }, MessengerIcon()),
    showConfirmModal && React.createElement('div', { className: 'book-chatbot-modal-overlay' },
      React.createElement('div', { className: 'book-chatbot-modal' },
        React.createElement('div', { className: 'book-chatbot-modal-content' },
          React.createElement('h3', null, 'Clear Chat History'),
          React.createElement('p', null, 'Are you sure you want to clear all chat history? This action cannot be undone.'),
          React.createElement('div', { className: 'book-chatbot-modal-buttons' },
            React.createElement('button', {
              className: 'book-chatbot-modal-cancel',
              onClick: cancelClearHistory
            }, 'Cancel'),
            React.createElement('button', {
              className: 'book-chatbot-modal-confirm',
              onClick: confirmClearHistory
            }, 'Clear History')
          )
        )
      )
    )
  );
};

export default BookChatbot;
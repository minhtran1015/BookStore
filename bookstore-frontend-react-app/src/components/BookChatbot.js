import React, { useState, useRef, useEffect } from 'react';
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
    loadBooks();
  }, []);

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
      text: 'Hello! I\'m your personal book advisor. I can help you find books from our current inventory. What kind of books are you interested in?'
    };
    setMessages([initialMessage]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify([initialMessage]));
    setShowConfirmModal(false);
  };

  const cancelClearHistory = () => {
    setShowConfirmModal(false);
  };

  return React.createElement('div', { className: `book-chatbot-widget${open ? ' open' : ''}` },
    open ? React.createElement('div', { className: 'book-chatbot-box' },
      React.createElement('div', { className: 'book-chatbot-header' },
        React.createElement('div', { className: 'book-chatbot-header-left' },
          React.createElement('span', { className: 'book-chatbot-avatar' }, '🤖'),
          React.createElement('span', { className: 'book-chatbot-title' }, 'BookBot')
        ),
        React.createElement('div', { className: 'book-chatbot-header-buttons' },
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
            msg.text
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
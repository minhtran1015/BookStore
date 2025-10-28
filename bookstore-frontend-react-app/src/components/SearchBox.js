import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import './SearchBox.css';

const SearchBox = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword);
    }
  };

  return (
    <Form onSubmit={submitHandler} className="search-form">
      <div className="input-group">
        <Form.Control
          type='text'
          name='q'
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='Tìm kiếm sách...'
          className="search-input"
          value={keyword}
        />
        <div className="input-group-append">
          <Button type='submit' variant='outline-primary' className="search-button">
            <i className="fas fa-search"></i>
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default SearchBox;
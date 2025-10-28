import React from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from 'react-bootstrap';

const Paginate = ({ pages, page, link }) => {
  return (
    pages > 1 && (
      <Pagination>
        {[...Array(pages).keys()].map((x) => (
          <Link key={x} to={`${link}/${x + 1}`} className='page-link'>
            <Pagination.Item active={x + 1 === page}>{x + 1}</Pagination.Item>
          </Link>
        ))}
      </Pagination>
    )
  );
};

export default Paginate;

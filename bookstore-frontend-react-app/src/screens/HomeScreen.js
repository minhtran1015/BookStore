import Paginate from '../components/Paginate';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Product from '../components/Product';
import Message from '../components/Message';
import { Col, Row, Container, Button } from 'react-bootstrap';
import { listProductsAction } from '../actions/productActions';
import FullPageLoader from '../components/FullPageLoader';
import ReactPaginate from 'react-paginate';
import SearchBox from '../components/SearchBox';
import './HomeScreen.css';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const productList = useSelector((state) => state.productList);
  const { loading, error, products, pageResponse } = productList;
  const [currentPage, setCurrentPage] = useState(0);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    dispatch(listProductsAction(currentPage, keyword));
  }, [dispatch, currentPage, keyword]);

  const handlePageClick = (data) => {
    let selected = data.selected;
    setCurrentPage(selected);
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển trang
  };
  
  const handleSearch = (searchKeyword) => {
    setKeyword(searchKeyword);
    setCurrentPage(0); // Reset về trang đầu tiên khi tìm kiếm
  };

  return (
    <>
        <div className="category-links-container">
      <div className="category-links">
        <button 
          className={`category-button ${keyword === '' ? 'active' : ''}`} 
          onClick={() => setKeyword('')}
        >
          <i className="fas fa-book"></i>
          <span>Tất cả sách</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'fiction' ? 'active' : ''}`} 
          onClick={() => setKeyword('fiction')}
        >
          <i className="fas fa-feather-alt"></i>
          <span>Tiểu thuyết</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'science' ? 'active' : ''}`} 
          onClick={() => setKeyword('science')}
        >
          <i className="fas fa-atom"></i>
          <span>Khoa học</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'business' ? 'active' : ''}`} 
          onClick={() => setKeyword('business')}
        >
          <i className="fas fa-chart-line"></i>
          <span>Kinh doanh</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'biography' ? 'active' : ''}`} 
          onClick={() => setKeyword('biography')}
        >
          <i className="fas fa-user-tie"></i>
          <span>Tiểu sử</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'children' ? 'active' : ''}`} 
          onClick={() => setKeyword('children')}
        >
          <i className="fas fa-child"></i>
          <span>Thiếu nhi</span>
        </button>
      </div>
    </div>
  

      <div className="home-banner">
        <img src="/8620842.jpg" alt="BookStore Banner" />
      </div>
    <Container className="home-screen">
      <div className="home-header">
        <h1>Khám Phá Sách Mới</h1>
        <p>Thế giới tri thức trong tay bạn với những cuốn sách chất lượng nhất</p>
      </div>
      
      <SearchBox onSearch={handleSearch} />
      
      {error ? (
        <Message variant="danger">{error instanceof Object ? JSON.stringify(error) : error}</Message>
      ) : (
        <>
          {products && products.length > 0 ? (
            <div className="product-grid">
              {keyword && (
                <div className="search-results-info">
                  <h2 className="section-title">
                    <span className="text">Kết quả tìm kiếm: "{keyword}"</span>
                  </h2>
                  <button 
                    className="clear-search-btn" 
                    onClick={() => setKeyword('')}
                  >
                    <i className="fas fa-times"></i> Xóa tìm kiếm
                  </button>
                </div>
              )}
              <Row>
                {products.map((product) => (
                  <Col key={product.productId} sm={12} md={6} lg={4} xl={3} className="product-card-wrapper">
                    <Product product={product} />
                  </Col>
                ))}
              </Row>
            </div>
          ) : !loading && (
            <div className="empty-products">
              {keyword ? (
                <>
                  <i className="fas fa-search"></i>
                  <p>Không tìm thấy sách nào phù hợp với từ khóa "{keyword}"</p>
                  <Button 
                    variant="outline-primary" 
                    className="back-to-all" 
                    onClick={() => setKeyword('')}
                  >
                    <i className="fas fa-arrow-left"></i> Xem tất cả sách
                  </Button>
                </>
              ) : (
                <>
                  <i className="fas fa-book-open"></i>
                  <p>Không tìm thấy sản phẩm nào</p>
                </>
              )}
            </div>
          )}

          {pageResponse && pageResponse.totalPages > 1 && (
            <div className="pagination-container">
              <ReactPaginate
                previousLabel={<i className="fas fa-chevron-left"></i>}
                nextLabel={<i className="fas fa-chevron-right"></i>}
                breakLabel={"..."}
                breakClassName={"break-me"}
                pageCount={pageResponse?.totalPages || 1}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName={"custom-pagination"}
                pageClassName={"page-item"}
                activeClassName={"active"}
                pageLinkClassName={"page-link"}
                previousClassName={"page-item"}
                nextClassName={"page-item"}
                previousLinkClassName={"page-link nav-button"}
                nextLinkClassName={"page-link nav-button"}
                disabledClassName={"disabled"}
                forcePage={currentPage}
              />
            </div>
          )}

        </>
      )}
      {loading && <FullPageLoader />}
    </Container>
  </>
  );
};

export default HomeScreen;
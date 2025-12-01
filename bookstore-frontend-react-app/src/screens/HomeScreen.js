import Paginate from '../components/Paginate';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Product from '../components/Product';
import Message from '../components/Message';
import { Col, Row, Container, Button, Carousel } from 'react-bootstrap';
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
        <div className="category-links-container" style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)`
        }}>
      <div className="category-links">
        <button 
          className={`category-button ${keyword === '' ? 'active' : ''}`} 
          onClick={() => {
            setKeyword('');
            setTimeout(() => {
              const booksSection = document.querySelector('.home-header');
              if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
        >
          <i className="fas fa-book"></i>
          <span>Tất cả sách</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'fiction' ? 'active' : ''}`} 
          onClick={() => {
            setKeyword('fiction');
            setTimeout(() => {
              const booksSection = document.querySelector('.home-header');
              if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
        >
          <i className="fas fa-feather-alt"></i>
          <span>Tiểu thuyết</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'science' ? 'active' : ''}`} 
          onClick={() => {
            setKeyword('science');
            setTimeout(() => {
              const booksSection = document.querySelector('.home-header');
              if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
        >
          <i className="fas fa-atom"></i>
          <span>Khoa học</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'business' ? 'active' : ''}`} 
          onClick={() => {
            setKeyword('business');
            setTimeout(() => {
              const booksSection = document.querySelector('.home-header');
              if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
        >
          <i className="fas fa-chart-line"></i>
          <span>Kinh doanh</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'biography' ? 'active' : ''}`} 
          onClick={() => {
            setKeyword('biography');
            setTimeout(() => {
              const booksSection = document.querySelector('.home-header');
              if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
        >
          <i className="fas fa-user-tie"></i>
          <span>Tiểu sử</span>
        </button>
        
        <button 
          className={`category-button ${keyword === 'children' ? 'active' : ''}`} 
          onClick={() => {
            setKeyword('children');
            setTimeout(() => {
              const booksSection = document.querySelector('.home-header');
              if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
        >
          <i className="fas fa-child"></i>
          <span>Thiếu nhi</span>
        </button>
      </div>

    </div>
    <Container fluid className="home-screen">
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
            <div className="product-carousel-container">
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
              
              <Carousel 
                interval={null} 
                controls={true} 
                indicators={false}
                className="books-carousel"
                variant="dark"
              >
                {(() => {
                  // Responsive items per slide
                  const getItemsPerSlide = () => {
                    if (window.innerWidth < 768) return 1; // Mobile: 1 item
                    if (window.innerWidth < 992) return 2; // Tablet: 2 items
                    if (window.innerWidth < 1200) return 3; // Small desktop: 3 items
                    return 4; // Large desktop: 4 items
                  };
                  
                  const itemsPerSlide = getItemsPerSlide();
                  const chunks = [];
                  for (let i = 0; i < products.length; i += itemsPerSlide) {
                    chunks.push(products.slice(i, i + itemsPerSlide));
                  }
                  
                  return chunks.map((chunk, index) => (
                    <Carousel.Item key={index}>
                      <Row className="carousel-row justify-content-center">
                        {chunk.map((product) => (
                          <Col 
                            key={product.productId} 
                            xs={12} 
                            sm={6} 
                            md={6} 
                            lg={4} 
                            xl={3} 
                            className="product-card-wrapper"
                          >
                            <Product product={product} />
                          </Col>
                        ))}
                      </Row>
                    </Carousel.Item>
                  ));
                })()}
              </Carousel>
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



        </>
      )}
      {loading && <FullPageLoader />}
    </Container>
  </>
  );
};

export default HomeScreen;
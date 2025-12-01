import React, { useEffect, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col, Card, Container, Form, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { isAdmin } from '../service/CommonUtils';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listProductsAction, deleteProductAction } from '../actions/productActions';
import { PRODUCT_CREATE_RESET } from '../constants/productConstants';
import ReactPaginate from 'react-paginate';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import './ProductListScreen.css';

const ProductListScreen = ({ history, match }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const productList = useSelector((state) => state.productList);
  const { loading, error, products, pageResponse } = productList;

  const productDelete = useSelector((state) => state.productDelete);
  const { loading: loadingDelete, error: errorDelete, success: successDelete } = productDelete;

  const productCreate = useSelector((state) => state.productCreate);
  const { loading: loadingCreate, error: errorCreate, success: successCreate, product: createdProduct } = productCreate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET });

    if (!userInfo || !isAdmin()) {
      history.push('/login');
    }
    dispatch(listProductsAction(0));
  }, [dispatch, history, userInfo, successDelete, successCreate, createdProduct]);

  const deleteHandler = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không?`)) {
      dispatch(deleteProductAction(id));
    }
  };

  const createProductHandler = () => {
    history.push('/admin/product/create');
  };

  const handlePageClick = (data) => {
    let selected = data.selected;
    dispatch(listProductsAction(selected));
  };
  
  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = products ? products.filter(product => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Calculate statistics
  const totalProductTypes = products?.length || 0;
  const totalBooks = products?.reduce((sum, p) => sum + p.availableItemCount, 0) || 0;
  const inStockProducts = products?.filter(p => p.availableItemCount > 0).length || 0;
  const outOfStockProducts = products?.filter(p => p.availableItemCount === 0).length || 0;
  const lowStockProducts = products?.filter(p => p.availableItemCount > 0 && p.availableItemCount < 10).length || 0;
  const totalInventoryValue = products?.reduce((sum, p) => sum + (p.price * p.availableItemCount), 0) || 0;
  const averagePrice = totalProductTypes > 0 ? (products?.reduce((sum, p) => sum + p.price, 0) / totalProductTypes) : 0;

  return (
    <Container className="product-list-screen">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-boxes"></i>
          </div>
          <div className="header-text">
            <h1>Quản lý sản phẩm</h1>
            <p>Quản lý toàn bộ sản phẩm và theo dõi kho hàng</p>
          </div>
        </div>
        <Button className="create-product-btn" onClick={createProductHandler}>
          <i className="fas fa-plus"></i> Thêm sản phẩm
        </Button>
      </div>

      {/* Analytics Cards */}
      <Row className="analytics-section mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="analytics-card total-products">
            <Card.Body>
              <div className="analytics-icon">
                <i className="fas fa-books"></i>
              </div>
              <div className="analytics-content">
                <h3>{totalBooks}</h3>
                <p>Tổng số lượng sách</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="analytics-card in-stock">
            <Card.Body>
              <div className="analytics-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="analytics-content">
                <h3>{inStockProducts}</h3>
                <p>Loại sách còn hàng</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="analytics-card out-of-stock">
            <Card.Body>
              <div className="analytics-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="analytics-content">
                <h3>{outOfStockProducts}</h3>
                <p>Loại sách hết hàng</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="analytics-card low-stock">
            <Card.Body>
              <div className="analytics-icon">
                <i className="fas fa-box"></i>
              </div>
              <div className="analytics-content">
                <h3>{lowStockProducts}</h3>
                <p>Loại sách sắp hết (&lt;10)</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Stats */}
      <Row className="stats-section mb-4">
        <Col md={6} className="mb-3">
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-info">
                <div className="stats-icon inventory">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="stats-details">
                  <h4>${totalInventoryValue.toFixed(2)}</h4>
                  <p>Tổng giá trị kho hàng</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-3">
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-info">
                <div className="stats-icon average">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="stats-details">
                  <h4>${averagePrice.toFixed(2)}</h4>
                  <p>Giá trung bình mỗi sản phẩm</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="product-list-card">
        <Card.Body>
          <Row className="align-items-center mb-4">
            <Col md={6}>
              <h2 className="section-title">
                <i className="fas fa-list"></i> Danh sách sản phẩm
              </h2>
            </Col>
            <Col md={6}>
              <InputGroup className="search-input-group">
                <InputGroup.Text className="search-icon">
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <Button 
                    variant="light" 
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>
          
          {loadingDelete && <Loader />}
          {errorDelete && <Message variant='danger'>{errorDelete}</Message>}
          {successDelete && <Message variant='success'>Xóa sản phẩm thành công</Message>}
          
          {loadingCreate && <Loader />}
          {errorCreate && <Message variant='danger'>{errorCreate}</Message>}
          
          {loading ? (
            <div className="loader-container">
              <Loader />
            </div>
          ) : error ? (
            <Message variant='danger'>{error}</Message>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-products">
              {searchTerm ? (
                <>
                  <div className="empty-icon-container">
                    <i className="fas fa-search"></i>
                  </div>
                  <p>Không tìm thấy sản phẩm nào phù hợp với "<span className="search-term">{searchTerm}</span>"</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setSearchTerm('')}
                    className="clear-filter-btn"
                  >
                    <i className="fas fa-list"></i> Xem tất cả sản phẩm
                  </Button>
                </>
              ) : (
                <>
                  <div className="empty-icon-container">
                    <i className="fas fa-book-open"></i>
                  </div>
                  <p>Chưa có sản phẩm nào trong hệ thống</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive product-table-container">
                <Table hover className='product-table'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Hình ảnh</th>
                      <th>Tên sản phẩm</th>
                      <th>Giá</th>
                      <th>Danh mục</th>
                      <th>Số lượng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.productId}>
                        <td className="product-id">{product.productId}</td>
                        <td className="product-image-cell">
                          {product.imageId && (
                            <img 
                              src={`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${product.imageId}`} 
                              alt={product.productName} 
                              className="product-thumbnail"
                            />
                          )}
                        </td>
                        <td className="product-name">{product.productName}</td>
                        <td className="product-price">${product.price}</td>
                        <td>
                          <span className="product-category-badge">
                            {product.productCategory}
                          </span>
                        </td>
                        <td>
                          {product.availableItemCount > 0 ? (
                            <span className="product-count in-stock">
                              <i className="fas fa-check-circle"></i> {product.availableItemCount}
                            </span>
                          ) : (
                            <span className="product-count out-of-stock">
                              <i className="fas fa-times-circle"></i> Hết hàng
                            </span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <div className="table-actions">
                            <LinkContainer to={`/admin/product/${product.productId}/edit`}>
                              <Button variant='light' className='btn-action edit-btn'>
                                <i className='fas fa-edit'></i>
                              </Button>
                            </LinkContainer>
                            <Button 
                              variant='danger' 
                              className='btn-action delete-btn'
                              onClick={() => deleteHandler(product.productId, product.productName)}
                            >
                              <i className='fas fa-trash'></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <div className="pagination-container">
                <div className="product-count-info">
                  <i className="fas fa-book-open"></i> Hiển thị 
                  <span className="highlight">{filteredProducts.length}</span> / 
                  <span className="highlight">{products.length}</span> sản phẩm
                  {searchTerm && (
                    <Button 
                      variant="link" 
                      className="clear-search-link"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="fas fa-times-circle"></i> Xóa tìm kiếm
                    </Button>
                  )}
                </div>
                
                {pageResponse && pageResponse.totalPages > 1 && (
                  <ReactPaginate
                    previousLabel={<i className="fas fa-chevron-left"></i>}
                    nextLabel={<i className="fas fa-chevron-right"></i>}
                    breakLabel={"..."}
                    breakClassName={"break-me"}
                    pageCount={pageResponse?.totalPages || 1}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
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
                  />
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductListScreen;
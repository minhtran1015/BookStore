import React, { useEffect, useState } from 'react';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import { Button, Card, Col, Form, Image, ListGroup, ListGroupItem, Row, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import FullPageLoader from '../components/FullPageLoader';
import { createProductReviewAction, listProductDetailsAction, listProductReviewsAction, getImageAction } from '../actions/productActions';
import { addToCartAction } from '../actions/cartActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Rating from '../components/Rating';
import { getImageApi, getProductDetailApi } from '../service/RestApiCalls';
import './ProductScreen.css'; // Sẽ tạo file CSS riêng

const ProductScreen = (props) => {
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState('');
  const [productimageBase64, setProductimageBase64] = useState(null);
  const [product, setProduct] = useState(null);

  const dispatch = useDispatch();
  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error } = productDetails;

  const productReviews = useSelector((state) => state.productReviews);
  const { loading: loadingProductReviews, error: errorProductReviews, reviews } = productReviews;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const productReviewCreate = useSelector((state) => state.productReviewCreate);
  const { success: successProductReview, loading: loadingProductReview, error: errorProductReview } = productReviewCreate;

  useEffect(async () => {
    await getProductDetailApi(props.match.params.id).then((r) => {
      setProduct(r);
    });
    dispatch(listProductReviewsAction(props.match.params.id));
    await getImageApi(product?.imageId).then((r) => {
      setProductimageBase64(r);
    });
  }, [dispatch, product?.imageId]);

  const addToCartHandler = () => {
    dispatch(addToCartAction({
      productId: props.match.params.id,
      quantity: qty
    }));
    props.history.push('/cart');
  };

  const createProductReviewHandler = (e) => {
    e.preventDefault();
    dispatch(
      createProductReviewAction({
        productId: props.match.params.id,
        ratingValue: rating,
        reviewMessage: reviewMessage
      })
    );
  };

  return (
    <Container className="product-screen-container">
      <Link className='back-button' to='/'>
        <i className="fas fa-arrow-left"></i> Quay lại
      </Link>

      {error ? (
        <Message variant='danger'>{error}</Message>
      ) : product ? (
        <>
          <div className="product-details-container">
            <Row>
              <Col md={6} className="product-image-column">
                {productimageBase64 && (
                  <div className="product-image-wrapper">
                    <Image
                      className="product-image"
                      src={`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${product?.imageId}`}
                      alt={product.productName}
                      fluid
                    />
                  </div>
                )}
              </Col>
              <Col md={3} className="product-info-column">
                <div className="product-info">
                  <h2 className="product-title">{product.productName}</h2>
                  
                  <div className="product-rating-wrapper">
                    <Rating value={product.averageRating} text={`${product.noOfRatings} đánh giá`} />
                  </div>
                  
                  <div className="product-price">
                    <span className="price-label">Giá: </span>
                    <span className="price-value">${product.price}</span>
                  </div>
                  
                  <div className="product-description">
                    <h4>Mô tả:</h4>
                    <p>{product.description}</p>
                  </div>
                </div>
              </Col>
              <Col md={3} className="product-action-column">
                <Card className="product-action-card">
                  <ListGroup variant='flush'>
                    <ListGroupItem className="price-item">
                      <Row>
                        <Col>Giá:</Col>
                        <Col className="text-right">
                          <strong className="price-value">${product.price}</strong>
                        </Col>
                      </Row>
                    </ListGroupItem>

                    <ListGroupItem className="status-item">
                      <Row>
                        <Col>Trạng thái:</Col>
                        <Col className="text-right">
                          {product.availableItemCount > 0 ? (
                            <span className="in-stock">
                              <i className="fas fa-check-circle"></i> Còn hàng
                            </span>
                          ) : (
                            <span className="out-of-stock">
                              <i className="fas fa-times-circle"></i> Hết hàng
                            </span>
                          )}
                        </Col>
                      </Row>
                    </ListGroupItem>

                    {product.availableItemCount > 0 && (
                      <ListGroup.Item className="qty-item">
                        <Row>
                          <Col>Số lượng:</Col>
                          <Col>
                            <Form.Control
                              as='select'
                              value={qty}
                              onChange={(e) => setQty(e.target.value)}
                              className="qty-select"
                            >
                              {product.availableItemCount > 10
                                ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => (
                                    <option key={x + 1} value={x + 1}>
                                      {x + 1}
                                    </option>
                                  ))
                                : [...Array(product.availableItemCount).keys()].map((x) => (
                                    <option key={x + 1} value={x + 1}>
                                      {x + 1}
                                    </option>
                                  ))}
                            </Form.Control>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )}

                    <ListGroupItem className="action-item">
                      <Button 
                        onClick={addToCartHandler} 
                        className='add-to-cart-btn' 
                        type='button' 
                        disabled={product.availableItemCount <= 0}
                      >
                        <i className="fas fa-shopping-cart"></i> Thêm vào giỏ hàng
                      </Button>
                    </ListGroupItem>
                  </ListGroup>
                </Card>
              </Col>
            </Row>
          </div>
          
          <div className="reviews-section">
            <Row>
              <Col md={6} className="product-reviews-column">
                <div className="reviews-header">
                  <h3><i className="far fa-comment-alt"></i> Đánh giá sản phẩm</h3>
                </div>
                
                {reviews?.length === 0 ? (
                  <div className="no-reviews">
                    <i className="far fa-frown"></i>
                    <p>Chưa có đánh giá nào</p>
                  </div>
                ) : (
                  <ListGroup variant='flush' className="reviews-list">
                    {reviews?.map((review) => (
                      <ListGroup.Item key={review.reviewId} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-name">
                            <i className="fas fa-user-circle"></i> {review.userName}
                          </div>
                          <Rating value={review.ratingValue} />
                        </div>
                        <div className="review-body">
                          <p>{review.reviewMessage}</p>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Col>
              
              <Col md={6} className="review-form-column">
                <div className="review-form-card">
                  <h3><i className="fas fa-pencil-alt"></i> Viết đánh giá</h3>
                  
                  {successProductReview && (
                    <Message variant='success'>Gửi đánh giá thành công</Message>
                  )}
                  
                  {loadingProductReview && <Loader />}
                  
                  {errorProductReview && (
                    <Message variant='danger'>{errorProductReview}</Message>
                  )}
                  
                  {userInfo ? (
                    <Form onSubmit={createProductReviewHandler} className="review-form">
                      <Form.Group controlId='rating' className="rating-select-group">
                        <Form.Label>Đánh giá</Form.Label>
                        <Form.Control 
                          as='select' 
                          value={rating}
                          className="rating-select"
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value=''>Chọn sao...</option>
                          <option value='1'>1 - Kém</option>
                          <option value='2'>2 - Trung bình</option>
                          <option value='3'>3 - Tốt</option>
                          <option value='4'>4 - Rất tốt</option>
                          <option value='5'>5 - Tuyệt vời</option>
                        </Form.Control>
                      </Form.Group>
                      
                      <Form.Group controlId='reviewMessage' className="review-message-group">
                        <Form.Label>Nội dung đánh giá</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows='4'
                          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                          value={reviewMessage}
                          className="review-textarea"
                          onChange={(e) => setReviewMessage(e.target.value)}
                        ></Form.Control>
                      </Form.Group>
                      
                      <Button 
                        disabled={loadingProductReview} 
                        type='submit' 
                        className='submit-review-btn'
                      >
                        <i className="fas fa-paper-plane"></i> Gửi đánh giá
                      </Button>
                    </Form>
                  ) : (
                    <div className="login-prompt">
                      <i className="fas fa-user-lock"></i>
                      <p>
                        Vui lòng <Link to='/login'>đăng nhập</Link> để viết đánh giá
                      </p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </>
      ) : null}
      {loading && <FullPageLoader></FullPageLoader>}
    </Container>
  );
};

export default ProductScreen;
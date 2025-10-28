import React, { useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, ListGroup, Button, Card, Container } from 'react-bootstrap';
import Message from '../components/Message';
import CartItem from '../components/CartItem';
import { addToCartAction, getCartDetailsAction } from '../actions/cartActions';
import FullPageLoader from '../components/FullPageLoader';
import './CartScreen.css';

const CartScreen = ({ match, location }) => {
  const productId = match.params.id;
  const qty = location.search ? Number(location.search.split('=')[1]) : 1;
  const dispatch = useDispatch();
  const history = useHistory();
  const userLogin = useSelector((state) => state.userLogin);
  const cartState = useSelector((state) => state.cart);
  const { cart } = cartState;
  let loading = cartState.loading;
  let error = cartState.error;
  const { userInfo } = userLogin;
  const redirect = location.pathname + location.search;

  useEffect(() => {
    if (userInfo === null || userInfo === undefined) {
      history.push(`/login?redirect=${redirect}`);
      return;
    }
    if (productId) {
      dispatch(addToCartAction(productId, qty));
    } else {
      dispatch(getCartDetailsAction());
    }
  }, [dispatch, productId, qty, userInfo, history, redirect]);

  const checkoutHandler = () => {
    history.push('/login?redirect=shipping');
  };

  return (
    <Container className="cart-screen">
      {error ? (
        <Message variant='danger'> {JSON.stringify(error.message)}</Message>
      ) : (
        <>
          <div className="cart-title-section">
            <h1>
              <i className="fas fa-shopping-cart cart-title-icon"></i>
              Giỏ hàng của bạn
            </h1>
            <Link to="/" className="cart-continue-shopping">
              <i className="fas fa-long-arrow-alt-left"></i>
              Tiếp tục mua sắm
            </Link>
          </div>
          
          <Row>
            <Col lg={8}>
              {cart == null || cart?.cartItems?.length === 0 ? (
                <div className="cart-empty">
                  <i className="fas fa-shopping-cart"></i>
                  <p>Giỏ hàng của bạn đang trống</p>
                  <Link to="/" className="btn">
                    Khám phá sách ngay
                  </Link>
                </div>
              ) : (
                <div className="cart-items-container">
                  <ListGroup variant='flush'>
                    {cart?.cartItems?.map((item) => (
                      <CartItem key={item.productId} item={item} addToCart={addToCartAction}></CartItem>
                    ))}
                  </ListGroup>
                  <div className="text-center">
                    <Link to="/" className="cart-add-more">
                      <i className="fas fa-book"></i>
                      Thêm sách vào giỏ hàng
                    </Link>
                  </div>
                </div>
              )}
            </Col>
            
            <Col lg={4}>
              <div className="cart-summary">
                <h2 className="cart-summary-title">Tổng giỏ hàng</h2>
                
                <div className="cart-summary-row">
                  <span className="cart-summary-label">Số lượng sản phẩm:</span>
                  <span className="cart-summary-value">{cart?.cartItems?.length || 0}</span>
                </div>
                
                {cart?.cartItems?.length > 0 && (
                  <div className="cart-summary-row">
                    <span className="cart-summary-label">Tổng tiền sản phẩm:</span>
                    <span className="cart-summary-value">${cart?.totalPrice}</span>
                  </div>
                )}
                
                {cart?.cartItems?.length > 0 && (
                  <div className="cart-summary-row">
                    <span className="cart-summary-label">Phí vận chuyển:</span>
                    <span className="cart-summary-value">Miễn phí</span>
                  </div>
                )}
                
                <div className="cart-summary-row" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(166, 227, 233, 0.3)' }}>
                  <span className="cart-summary-label">Tổng thanh toán:</span>
                  <span className="cart-summary-total">${cart?.totalPrice || 0}</span>
                </div>
                
                <button 
                  className="cart-checkout-btn" 
                  disabled={!cart?.cartItems?.length}
                  onClick={checkoutHandler}
                >
                  Thanh toán ngay
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </Col>
          </Row>
        </>
      )}
      {loading && <FullPageLoader />}
    </Container>
  );
};

export default CartScreen;
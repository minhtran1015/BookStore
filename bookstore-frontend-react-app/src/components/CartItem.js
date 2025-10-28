import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Row, Col, ListGroup, Image, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { removeFromCartAction } from '../actions/cartActions.js';
import { getProductDetailApi } from '../service/RestApiCalls.js';
import Message from '../components/Message';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import './CartItem.css';

const CartItem = ({ item, addToCart }) => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDetail = await getProductDetailApi(item.productId);
        setProduct(productDetail);
      } catch (err) {
        setError(err);
      }
    };
    
    fetchProduct();
  }, [item]);

  const removeFromCartHandler = (cartItemId) => {
    dispatch(removeFromCartAction(cartItemId));
  };

  return (
    <>
      {error ? (
        <Message variant='danger'> {JSON.stringify(error.message)}</Message>
      ) : (
        <ListGroup.Item className="cart-item">
          <Row className="align-items-center">
            <Col xs={4} md={2}>
              <Image 
                src={`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${product?.imageId}`} 
                alt={item.productName} 
                fluid 
                rounded
              />
            </Col>
            <Col xs={8} md={4} className="product-name-column">
              <Link to={`/product/${item.productId}`}>{item.productName}</Link>
            </Col>
            <Col xs={4} md={2} className="price-column mt-3 mt-md-0">
              ${item.itemPrice}
            </Col>
            <Col xs={4} md={2} className="mt-3 mt-md-0">
              {product && (
                <Form.Control 
                  as='select' 
                  value={item.quantity} 
                  onChange={(e) => dispatch(addToCart(item.productId, Number(e.target.value)))}
                >
                  {product.availableItemCount > 11
                    ? [...Array(10).keys()].map((x) => (
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
              )}
            </Col>
            <Col xs={3} md={1} className="subtotal-column mt-3 mt-md-0">
              ${(item.itemPrice * item.quantity).toFixed(2)}
            </Col>
            <Col xs={1} md={1} className="text-right mt-3 mt-md-0">
              <button 
                type="button"
                className="btn-remove"
                onClick={() => removeFromCartHandler(item.cartItemId)}
              >
                <i className="fas fa-trash"></i>
              </button>
            </Col>
          </Row>
        </ListGroup.Item>
      )}
    </>
  );
};

export default CartItem;
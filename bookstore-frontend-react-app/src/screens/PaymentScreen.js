import React, { useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, ListGroup, Row, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { savePaymentMethodIdToLocalStorage } from '../actions/orderActions';
import { getMyPaymentMethodsAction, savePaymentMethodAction } from '../actions/paymentActions';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import Message from '../components/Message';

const PaymentScreen = ({ history }) => {
  const order = useSelector((state) => state.order);
  const { shippingAddressId } = order;

  if (!shippingAddressId) {
    history.push('/shipping');
  }

  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [expirationMonth, setExpirationMonth] = useState('10');
  const [expirationYear, setExpirationYear] = useState('23');
  const [cvv, setCvv] = useState('123');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();

  const paymentMethodSave = useSelector((state) => state.paymentMethodSave);
  const { success, loading: saveLoading, error: saveError } = paymentMethodSave;

  const paymentMethodListMy = useSelector((state) => state.paymentMethodListMy);
  const { paymentMethods, loading: listLoading, error: listError } = paymentMethodListMy;

  useEffect(() => {
    dispatch(getMyPaymentMethodsAction());
  }, [dispatch]);

  const proceedToPlaceOrder = () => {
    dispatch(savePaymentMethodIdToLocalStorage(paymentMethodId));
    history.push('/placeorder');
  };

  const saveCard = () => {
    // Validate card number format (remove spaces)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      setMessage('Invalid card number. Please enter 16 digits.');
      return;
    }

    // Validate expiration month
    if (parseInt(expirationMonth) < 1 || parseInt(expirationMonth) > 12) {
      setMessage('Invalid expiration month. Please enter a value between 1 and 12.');
      return;
    }

    // Validate expiration year
    const currentYear = new Date().getFullYear() % 100;
    if (parseInt(expirationYear) < currentYear) {
      setMessage('Card has expired. Please enter a valid expiration year.');
      return;
    }

    // Validate CVV
    if (cvv.length < 3 || cvv.length > 4) {
      setMessage('Invalid CVV. Please enter 3 or 4 digits.');
      return;
    }

    const cardRequestBody = {
      card: {
        cardNumber: cleanCardNumber,
        expirationMonth: parseInt(expirationMonth),
        expirationYear: parseInt(expirationYear),
        cvv: cvv
      }
    };

    dispatch(savePaymentMethodAction(cardRequestBody));
  };

  return (
    <>
      <CheckoutSteps step1 step2 step3 />
      <Row className='mx-5 justify-content-md-center'>
        <h1 className='mx-5 justify-content-md-center'>Payment Method</h1>
      </Row>
      <hr></hr>
      {(saveError || listError) && <Message variant='danger'>{JSON.stringify(saveError) || JSON.stringify(listError)}</Message>}
      {message && <Message variant='danger'>{message}</Message>}
      <Row>
        <Col xs={12} md={6}>
          {listLoading ? (
            <Loader></Loader>
          ) : (
            <>
              <h2>Select Payment Method</h2>
              {paymentMethods.map((a) => (
                <>
                  <ListGroup.Item key={a.paymentMethodId} variant='flush'>
                    <InputGroup>
                      <Col md={1}>
                        <Form.Check
                          type='radio'
                          id={a.paymentMethodId}
                          value={paymentMethodId}
                          name='paymentMethod'
                          checked={a.paymentMethodId === paymentMethodId}
                          onChange={(e) => {
                            console.log(a.paymentMethodId);
                            setPaymentMethodId(a.paymentMethodId);
                          }}
                        ></Form.Check>
                      </Col>
                      <Col>
                        <div
                          className='p-2'
                          style={{
                            whiteSpace: 'pre-wrap',
                            backgroundColor: '#eeeeee'
                          }}
                          onClick={(e) => {
                            console.log(a.paymentMethodId);
                            setPaymentMethodId(a.paymentMethodId);
                          }}
                        >
                          <p className='m-0' style={{ textTransform: 'uppercase' }}>
                            {a.cardType}
                          </p>
                          <p className='m-0'>
                            **** **** **** {a.cardLast4Digits} - {a.cardExpirationMonth} / {a.cardExpirationYear}
                          </p>
                        </div>
                      </Col>
                    </InputGroup>
                  </ListGroup.Item>
                </>
              ))}
            </>
          )}
        </Col>
        <Col xs={12} md={6}>
          <h2>
            <p>Add New Card</p>
          </h2>
          <Row className='mx-5 justify-content-md-center'>
            <Col>
              <Form>
                <Form.Group controlId='cardNumber'>
                  <Form.Label>Card Number</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Card Number'
                    value={cardNumber}
                    required
                    onChange={(e) => setCardNumber(e.target.value)}
                  ></Form.Control>
                </Form.Group>

                <Form.Group controlId='expirationMonth'>
                  <Form.Label>Expiration Month</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Exp Month'
                    value={expirationMonth}
                    required
                    onChange={(e) => setExpirationMonth(e.target.value)}
                  ></Form.Control>
                </Form.Group>

                <Form.Group controlId='expirationYear'>
                  <Form.Label>Expiration Year</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Exp Year'
                    value={expirationYear}
                    required
                    onChange={(e) => setExpirationYear(e.target.value)}
                  ></Form.Control>
                </Form.Group>

                <Form.Group controlId='cvv'>
                  <Form.Label>Cvv</Form.Label>
                  <Form.Control
                    type='password'
                    placeholder='Cvv'
                    value={cvv}
                    required
                    onChange={(e) => setCvv(e.target.value)}
                  ></Form.Control>
                </Form.Group>
              </Form>
            </Col>
          </Row>
          <Row className='mx-5 justify-content-md-center'>
            <Button type='submit' variant='primary' onClick={saveCard} disabled={saveLoading}>
              {saveLoading ? <Spinner as='span' animation='border' size='sm' role='status' aria-hidden='true' /> : <>Add Card</>}
            </Button>
          </Row>
        </Col>
      </Row>

      <hr></hr>
      <Row className='mx-5 justify-content-md-center'>
        <Button type='submit' variant='primary' onClick={proceedToPlaceOrder} className='mt-3' disabled={!paymentMethodId}>
          Proceed to PlaceOrder
        </Button>
      </Row>
    </>
  );
};

export default PaymentScreen;

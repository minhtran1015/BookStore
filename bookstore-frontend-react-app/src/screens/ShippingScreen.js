import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import Message from '../components/Message';
import { saveShippingAddressIdToLocalStorage, saveBillingAddressIdToLocalStorage } from '../actions/orderActions';
import { getMyAddresesAction, saveAddressAction, deleteAddressAction } from '../actions/addressActions';
import FullPageLoader from '../components/FullPageLoader';
import './ShippingScreen.css';

const ShippingScreen = ({ history }) => {
  const [shippingCheckbox, setShippingCheckbox] = useState(true);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');

  const dispatch = useDispatch();

  const addressList = useSelector((state) => state.addressListMy);
  const { addresses, loading: addressListLoading, error: addressListError } = addressList;

  const addressSave = useSelector((state) => state.addressSave);
  const { success, loading: addressSaveLoading, error: addressSaveError } = addressSave;

  useEffect(() => {
    getShippingAddress();
    if (addresses?.length > 0) {
      setBillingAddressId(addresses[0].addressId);
      setShippingAddressId(addresses[0].addressId);
    }
  }, [dispatch]);

  const getShippingAddress = async () => {
    dispatch(getMyAddresesAction());
  };

  const saveAddressHandler = async (e) => {
    e.preventDefault();
    const addressRequestBody = {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone
    };
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry(0);
    setPhone('');
    dispatch(saveAddressAction(addressRequestBody));
  };

  const proceedToPayment = () => {
    if (shippingAddressId === null || shippingAddressId === '') {
      setMessage('Shipping Address is required');
      return;
    }
    dispatch(saveShippingAddressIdToLocalStorage(shippingAddressId));
    dispatch(saveBillingAddressIdToLocalStorage(billingAddressId));
    history.push('/payment');
  };

  const deleteAddress = (addressId) => {
    if (addressId === billingAddressId) {
      setBillingAddressId(null);
    }
    if (addressId === shippingAddressId) {
      setShippingAddressId(null);
    }
    dispatch(deleteAddressAction(addressId));
  };

  return (
    <div className="shipping-screen">
      {(addressListLoading || addressSaveLoading) && <FullPageLoader />}
      
      <Container fluid className="shipping-container">
        <div className="shipping-header">
          <h1>
            <i className="fas fa-shipping-fast"></i>
            Thông Tin Giao Hàng
          </h1>
          <p>Vui lòng chọn hoặc thêm địa chỉ giao hàng của bạn</p>
        </div>

        <Row className="shipping-content">
          {/* Existing Addresses */}
          <Col lg={8} className="addresses-section">
            <Card className="addresses-card">
              <Card.Header>
                <h3>
                  <i className="fas fa-map-marker-alt"></i> &nbsp;
                  Địa Chỉ Đã Lưu ({addresses?.length || 0})
                </h3>
              </Card.Header>
              <Card.Body>
                {addresses && addresses.length > 0 ? (
                  <div className="addresses-grid">
                    {addresses.map((address) => (
                      <div 
                        key={address.addressId}
                        className={`address-card ${shippingAddressId === address.addressId ? 'selected' : ''}`}
                        onClick={() => setShippingAddressId(address.addressId)}
                      >
                        <div className="address-header">
                          <div className="address-type">
                            <i className="fas fa-home"></i>
                            <span>Địa chỉ {address.addressId}</span>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAddress(address.addressId);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                        <div className="address-details">
                          <p className="address-line">{address.addressLine1}</p>
                          {address.addressLine2 && <p className="address-line">{address.addressLine2}</p>}
                          <p className="address-location">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="address-country">{address.country}</p>
                          {address.phone && (
                            <p className="address-phone">
                              <i className="fas fa-phone"></i> {address.phone}
                            </p>
                          )}
                        </div>
                        <div className="address-actions">
                          <div className="address-selection">
                            <Form.Check
                              type="radio"
                              name="shippingAddress"
                              checked={shippingAddressId === address.addressId}
                              onChange={() => setShippingAddressId(address.addressId)}
                              label="Chọn làm địa chỉ giao hàng"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-addresses">
                    <i className="fas fa-map-marked-alt"></i> &nbsp;
                    <h4>Chưa có địa chỉ nào</h4>
                    <p>Hãy thêm địa chỉ giao hàng đầu tiên của bạn</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Add New Address Form */}
          <Col lg={4} className="add-address-section">
            <Card className="add-address-card">
              <Card.Header>
                <h3>
                  <i className="fas fa-plus-circle"></i> &nbsp;
                  Thêm Địa Chỉ Mới
                </h3>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={saveAddressHandler} className="address-form">
                  <Form.Group className="form-group">
                    <Form.Label>
                      <i className="fas fa-road"></i> &nbsp;
                      Địa chỉ dòng 1 *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Số nhà, tên đường..."
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="form-group">
                    <Form.Label>
                      <i className="fas fa-building"></i> &nbsp;
                      Địa chỉ dòng 2
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Tòa nhà, căn hộ... (tùy chọn)"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="form-group">
                        <Form.Label>
                          <i className="fas fa-city"></i> &nbsp;
                          Thành phố *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Thành phố"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="form-group">
                        <Form.Label>
                          <i className="fas fa-map"></i> &nbsp;
                          Tỉnh/Thành *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Tỉnh/Thành"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="form-group">
                        <Form.Label>
                          <i className="fas fa-mail-bulk"></i> &nbsp;
                          Mã bưu điện *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Mã bưu điện"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="form-group">
                        <Form.Label>
                          <i className="fas fa-flag"></i> &nbsp;
                          Quốc gia *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Việt Nam"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="form-group">
                    <Form.Label>
                      <i className="fas fa-phone"></i> &nbsp;
                      Số điện thoại
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Số điện thoại liên hệ"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="add-address-btn"
                    disabled={addressSaveLoading}
                  >
                    {addressSaveLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> &nbsp;
                        Lưu địa chỉ
                      </>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Billing Address Section */}
        <Row className="billing-section">
          <Col lg={12}>
            <Card className="billing-card">
              <Card.Header>
                <h3>
                  <i className="fas fa-file-invoice"></i> &nbsp;
                  Địa Chỉ Thanh Toán
                </h3>
              </Card.Header>
              <Card.Body>
                <Form.Check
                  type="checkbox"
                  checked={shippingCheckbox}
                  onChange={(e) => {
                    setShippingCheckbox(e.target.checked);
                    if (e.target.checked) {
                      setBillingAddressId(shippingAddressId);
                    }
                  }}
                  label="Sử dụng cùng địa chỉ giao hàng"
                  className="same-address-checkbox"
                />
                
                {!shippingCheckbox && (
                  <div className="billing-addresses">
                    <h4>Chọn địa chỉ thanh toán:</h4>
                    <div className="billing-addresses-grid">
                      {addresses?.map((address) => (
                        <div
                          key={address.addressId}
                          className={`billing-address-card ${billingAddressId === address.addressId ? 'selected' : ''}`}
                          onClick={() => setBillingAddressId(address.addressId)}
                        >
                          <Form.Check
                            type="radio"
                            name="billingAddress"
                            checked={billingAddressId === address.addressId}
                            onChange={() => setBillingAddressId(address.addressId)}
                          />
                          <div className="billing-address-info">
                            <p>{address.addressLine1}</p>
                            <p>{address.city}, {address.state} {address.postalCode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Messages and Actions */}
        {message && <Message variant="warning">{message}</Message>}
        {addressListError && <Message variant="danger">{addressListError}</Message>}
        {addressSaveError && <Message variant="danger">{addressSaveError}</Message>}
        {success && <Message variant="success">Địa chỉ đã được lưu thành công!</Message>}

        <div className="shipping-actions">
          <Button
            variant="outline-secondary"
            className="back-btn"
            onClick={() => history.push('/cart')}
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại giỏ hàng
          </Button>
          
          <Button
            variant="primary"
            className="continue-btn"
            onClick={proceedToPayment}
            disabled={!shippingAddressId || !billingAddressId}
          >
            Tiếp tục thanh toán
            <i className="fas fa-arrow-right"></i>
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default ShippingScreen;

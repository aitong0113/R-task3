//一、環境設定與套件引入
import { useState, useEffect, useRef } from 'react';
import * as bootstrap from 'bootstrap';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

//二、主要元件 App（後台主控頁）
function App() {


  //三、State 與 Ref 區（資料與 UI 控制）
  const [isNew, setIsNew] = useState(true);
  // 登入表單資料
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  // 是否已通過登入驗證
  const [isAuth, setisAuth] = useState(false);
  // 產品列表資料
  const [products, setProducts] = useState([]);
  // Bootstrap Modal 的 ref（用來控制開 / 關）
  const productModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  // 目前正在新增 / 編輯 / 刪除的產品資料（暫存用）
  const [tempProduct, setTempProduct] = useState({
    title: "",
    category: "",
    unit: "",
    origin_price: 0,
    price: 0,
    description: "",
    content: "",
    is_enabled: 0,
    imageUrl: "",
  });


// 四、Modal 開啟控制（新增 / 編輯）
  const openNewModal = () => {
    // 設定為新增模式
    setIsNew(true);
    // 重置 tempProduct，避免殘留舊資料
    setTempProduct({
      title: "",
      category: "",
      unit: "",
      origin_price: 0,
      price: 0,
      description: "",
      content: "",
      is_enabled: 0,
      imageUrl: "",
    });
    // 開啟產品 Modal
    productModalRef.current.show();
  };

  //編輯產品 Modal
  const openEditModal = (item) => {
    // 設定為編輯模式
    setIsNew(false);
    // 將點擊的產品資料帶入 tempProduct
    setTempProduct({ ...item });
    // 開啟產品 Modal
    productModalRef.current.show();
  };


//五、產品 CRUD 行為
  const createProduct = async () => {
    // 基本欄位驗證
    if (!tempProduct.title || !tempProduct.category || !tempProduct.unit) {
      alert('請填寫完整產品資料');
      return;
    }
    try {
      // 呼叫後台新增產品 API
      await axios.post(
        `${API_BASE}/api/${API_PATH}/admin/product`,
        { data: tempProduct }
      );
      // 關閉 Modal 並更新產品列表
      productModalRef.current.hide();
      await getProducts();
      alert("新增成功");

    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.message || "新增失敗");
    }
  };

//更新產品
    const updateProduct = async () => {
    try {
      // 依產品 id 更新資料
      await axios.put(
        `${API_BASE}/api/${API_PATH}/admin/product/${tempProduct.id}`,
        { data: tempProduct }
      );

      productModalRef.current.hide();
      await getProducts();
      alert("更新成功");
    } catch (err) {
      alert(err.response?.data?.message || "更新失敗");
    }
  };


// 刪除產品（含確認 Modal）
    const deleteProduct = async () => {
    try {
      // 依目前 tempProduct.id 刪除產品
      await axios.delete(
        `${API_BASE}/api/${API_PATH}/admin/product/${tempProduct.id}`
      );

      deleteModalRef.current.hide();
      await getProducts();
      alert('刪除成功');
    } catch (err) {
      alert(err.response?.data?.message || '刪除失敗');
    }
  };


 //六、表單資料處理（產品）
  const handleProductChange = (e) => {
    const { id, value, type, checked } = e.target;

    setTempProduct((prev) => {
      let newValue = value;
      // checkbox → 轉為 1 / 0（符合後台 API）
      if (type === 'checkbox') {
        newValue = checked ? 1 : 0;
      }
      // 價格欄位 → 確保為 number
      if (id === 'origin_price' || id === 'price') {
        newValue = value === '' ? 0 : Number(value);
      }

      return {
        ...prev,
        [id]: newValue,
      };
    });
  };

//七、取得產品列表
  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/${API_PATH}/admin/products`
      );
      setProducts(res.data.products);
    } catch (err) {
      console.log(err.response?.data?.message);
    }
  };

  // 八、登入驗證與初始化（useEffect）
  // checkAdmin，直接包在 useEffect 裡，符合ESLint規範
  useEffect(() => {
    const init = async () => {
      // 從 cookie 取出 token
      const token = document.cookie.replace(
        /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      // 設定 axios 預設 Authorization
      axios.defaults.headers.common.Authorization = token;
      // 初始化 Bootstrap Modal
      productModalRef.current = new bootstrap.Modal('#productModal', {
        keyboard: false,
      });

      deleteModalRef.current = new bootstrap.Modal('#deleteModal', {
        keyboard: false,
      });

      try {
        // 驗證登入狀態
        await axios.post(`${API_BASE}/api/user/check`);
        setisAuth(true);
        // 驗證成功後取得產品列表
        await getProducts(); 

      } catch (err) {
        console.log(err.response?.data?.message);
      }
    };

    init();
  }, []);




  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common.Authorization = token;
      setisAuth(true);
    } catch (error) {
      alert("登入失敗: " + error.response.data.message);
    }
  };




  return (
    <>
      {isAuth ? (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              {/* 按鈕觸發 Modal */}
              <button
                className="btn btn-primary"
                onClick={openNewModal}
              >
                建立新的產品
              </button>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="120">編輯</th>
                </tr>
              </thead>
              {/*整個 <tbody> 換成這個：*/}
              <tbody>
                {products.length > 0 ? (
                  products.map((item) => (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{item.title}</td>
                      <td className="text-end">{item.origin_price}</td>
                      <td className="text-end">{item.price}</td>
                      <td>
                        {item.is_enabled ? (
                          <span className="text-success">啟用</span>
                        ) : (
                          <span>未啟用</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openEditModal(item)}
                          >
                            編輯
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              setTempProduct(item);
                              deleteModalRef.current.show();
                            }}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      尚無產品資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="password">Password</label>
                </div>
                <button
                  className="btn btn-lg btn-primary w-100 mt-3"
                  type="submit"
                >
                  登入
                </button>
              </form>
            </div>
          </div>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className="modal-header bg-dark text-white">
              <h5 id="productModalLabel" className="modal-title">
                <span>{isNew ? '新增產品' : '編輯產品'}</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        id="imageUrl"
                        type="text"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                        value={tempProduct.imageUrl}
                        onChange={handleProductChange}
                      />
                    </div>
                    <img
                      className="img-fluid"
                      src={tempProduct.imageUrl}
                      alt=""
                    />
                  </div>
                  <div>
                    <button className="btn btn-outline-primary btn-sm d-block w-100">
                      新增圖片
                    </button>
                  </div>
                  <div>
                    <button className="btn btn-outline-danger btn-sm d-block w-100">
                      刪除圖片
                    </button>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">標題</label>
                    <input
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                      value={tempProduct.title}
                      onChange={handleProductChange}
                    />
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">分類</label>
                      <input
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                        value={tempProduct.category}
                        onChange={handleProductChange}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">單位</label>
                      <input
                        id="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入單位"
                        value={tempProduct.unit}
                        onChange={handleProductChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">原價</label>
                      <input
                        id="origin_price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入原價"
                        value={tempProduct.origin_price}
                        onChange={handleProductChange}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">售價</label>
                      <input
                        id="price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入售價"
                        value={tempProduct.price}
                        onChange={handleProductChange}
                      />
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">產品描述</label>
                    <textarea
                      id="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                      value={tempProduct.description}
                      onChange={handleProductChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">說明內容</label>
                    <textarea
                      id="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                      value={tempProduct.content}
                      onChange={handleProductChange}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={tempProduct.is_enabled === 1}
                        onChange={handleProductChange}
                      />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={isNew ? createProduct : updateProduct}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        id="deleteModal"
        className="modal fade"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content border-0">
            <div className="modal-header bg-light text-white">
              <h5 className="modal-title">刪除產品</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              />
            </div>

            <div className="modal-body">
              <p className="text-center">
                是否確定刪除
                <br />
                <strong className="text-danger">
                  {tempProduct.title}
                </strong>？
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={deleteProduct}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


export default App;
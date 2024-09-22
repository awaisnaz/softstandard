import {useState, useEffect} from "react";
import { Form, Input, Button, Card, Alert } from 'antd';

const Logout = () => {
  const [form] = Form.useForm();

  let [message, setMessage] = useState(null);
  let [messageType, setMessageType] = useState(null);

  const onFinish = (values) => {
    (async () => {
      const response = await fetch('http://localhost:3000/logout', {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        setMessage("Logout successful!");
        setMessageType("success");
      }
      else {
        setMessage("Logout failed!");
        setMessageType("error");
      }
      const content = await response.json();
    })();
  };

  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
      <Card className="w-full max-w-md mx-auto">
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold mb-6">Logout</h2>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full">
              Logout
            </Button>
          </Form.Item>

          {message && (
            <Form.Item>
              <Alert message={message} type={messageType}/>
            </Form.Item>
          )}

        </Form>
      </Card>
    </div>
  );
};

export default Logout;
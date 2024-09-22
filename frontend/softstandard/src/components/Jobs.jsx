import {useState, useEffect} from "react";
import { Card, Table, Modal, Button, Form, Input, Alert } from "antd";
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';

const Jobs = () => {
  const [form] = Form.useForm();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedJobTimestamp, setSelectedJobTimestamp] = useState(null);
  const [selectedJobCompany, setSelectedJobCompany] = useState(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState(null);
  const [selectedJobDescription, setSelectedJobDescription] = useState(null);

  const [isAddJobModalVisible, setIsAddJobModalVisible] = useState(false);

  const [aiMode, setAiMode] = useState(false);

  let [message, setMessage] = useState(null);
  let [messageType, setMessageType] = useState(null);

  let { data, isPending, isLoading, isError,  } = useQuery({
    queryKey: ["jobs", page],
    queryFn: async ()=>
      await fetch('http://localhost:3000/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({page})
      }).then(async (res) => {
        res = await res.json();
        let temp = [];
        res.jobs.map((job, id)=>{
          job.timestamp = new Date(job.timestamp).toLocaleString();
          job.key = (page - 1)*10 + id;
          job.title = <div style={{fontWeight:"bold",cursor:"pointer"}} onClick={()=>{setIsModalVisible(true); setSelectedJobTimestamp(job.timestamp); setSelectedJobCompany(job.companyName); setSelectedJobTitle(job.title); setSelectedJobDescription(job.description);}}>{job.title}</div>;
          temp.push(job);
        });
        res.jobs = temp;
        return res;
      })
  });

  if (isPending) return <div>Loading...</div>;
  if (isLoading) return <div><h2>Loading...</h2></div>;
  if (isError) return <div>Error fetching data</div>;

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'time',
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: 'Job',
      dataIndex: 'title',
      key: 'title',
    },
  ];

  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const closeModal = () => {
    setIsModalVisible(null);
  };

  const closeAddJobModal = () => {
    setIsAddJobModalVisible(null);
    setMessage(null);
  };

  const onFinish = (values) => {
    if (aiMode) {
      (async () => {
        const response = await fetch('http://localhost:3000/genJob', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        });
        if (response.ok) {
          setMessage("Gen Job successful!");
          setMessageType("success");
        }
        else {
          setMessage("Gen Job failed!");
          setMessageType("error");
        }
        const content = await response.json();
        form.setFieldsValue({
          title: content.response.title,
          description: content.response.description
        });
    
        setAiMode(false);
      })();
      return;
    }
    else (async () => {
      const response = await fetch('http://localhost:3000/addJob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      if (response.ok) {
        setMessage("Job Add successful!");
        setMessageType("success");
      }
      else {
        setMessage("Job Add failed!");
        setMessageType("error");
      }
      const content = await response.json();
    })();
  };

  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
      <Card className="w-full max-w-md mx-auto">
        <div>
          <div style={{display:"flex", justifyContent:"center", alignItems: "center"}}>
            <div style={{display:"flex", justifyContent:"start", width:"100%"}}>
              <h2 className="text-2xl font-semibold mb-6">Jobs</h2>
            </div>
            <div style={{display:"flex", justifyContent:"end", width:"100%"}}>
              <Button type="primary" htmlType="submit" className="w-full" onClick={()=>{setIsAddJobModalVisible(true)}}>
                Add Job
              </Button>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
            <Table
              columns={columns}
              dataSource={data.jobs}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: data.total,
              }}
              onChange={handleTableChange}
              rowKey="_id"
            />
            <Modal
              title={selectedJobTitle}
              open={isModalVisible}
              onCancel={closeModal}
              footer={null}
            >
              <p><strong>Company:</strong> {selectedJobCompany}</p>
              <p><strong>Date:</strong> {selectedJobTimestamp && new Date(selectedJobTimestamp).toLocaleString()}</p>
              <p><strong>Description:</strong></p>
              <p>{selectedJobDescription}</p>
            </Modal>
            <Modal
              title="Add Job"
              open={isAddJobModalVisible}
              onCancel={closeAddJobModal}
              footer={null}
            >
              <Card className="w-full max-w-md mx-auto">
                <Form
                  form={form}
                  name="login"
                  onFinish={onFinish}
                  layout="vertical"
                  className="space-y-4"
                >
                  <div style={{width:"100%", display:"flex"}}>
                    <div style={{width:"100%", display:"flex", justifyContent:"start", alignItems:"center"}}>
                      <h2 className="text-2xl font-semibold mb-6">Add Job</h2>
                    </div>
                    <div style={{width:"100%", display:"flex", justifyContent:"end", alignItems:"center"}}>
                      <Button type="primary" htmlType="submit" className="w-full" onClick={()=>{setAiMode(true)}}>
                        Generate Job Description*
                      </Button>
                    </div>
                  </div>
                  <Form.Item
                    name="company"
                    label="Company"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your Company Name',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="title"
                    label="Job Title"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter Job Title',
                      },
                    ]}
                    hasFeedback
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Job Description"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter Job Description',
                      },
                    ]}
                    hasFeedback
                  >
                    <Input.TextArea autoSize={{ minRows: 6, maxRows: 6 }}/>
                  </Form.Item>
                  <div>
                    * Enter minimal details above, and click Generate Job Description to autogenerate using AI.
                  </div>

                  <Form.Item>
                    <div style={{display:"flex", width:"100%", justifyContent:"end"}}>
                      <Button type="primary" htmlType="submit" className="w-full">
                        Add Job
                      </Button>
                    </div>
                  </Form.Item>

                  {message && (
                    <Form.Item>
                      <Alert message={message} type={messageType}/>
                    </Form.Item>
                  )}

                </Form>
              </Card>
            </Modal>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Jobs;
/**
 * Seed As-Is diagram for the Purchase-to-Pay process flow (mock data, see
 * `data/mock/process-flows.ts`), also used by the editor model tests.
 * Exercises every Stage 1 element: a pool with three lanes, start/end events,
 * user/manual/service tasks, an exclusive gateway with Yes/No flows, a
 * collapsed second pool and a message flow. Kept free of imports so
 * `node --experimental-strip-types` tests can load it.
 */
export const PROCESS_FLOW_SEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:trace="http://himark.co.za/schema/trace/1.0"
  id="Definitions_Seed" targetNamespace="http://himark.co.za/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_Requisition" name="Purchase requisition" processRef="Process_Requisition" />
    <bpmn:participant id="Participant_Supplier" name="Supplier" />
    <bpmn:messageFlow id="MessageFlow_PO" name="Purchase order" sourceRef="ServiceTask_CreatePO" targetRef="Participant_Supplier" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Requisition" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Requester" name="Requester">
        <bpmn:flowNodeRef>StartEvent_Need</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>UserTask_Capture</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>ManualTask_Return</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_LineManager" name="Line Manager">
        <bpmn:flowNodeRef>UserTask_Review</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Approved</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Finance" name="Finance">
        <bpmn:flowNodeRef>ServiceTask_CreatePO</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Issued</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_Need" name="Need identified">
      <bpmn:outgoing>Flow_Start_Capture</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="UserTask_Capture" name="Capture requisition">
      <bpmn:extensionElements>
        <trace:auditFields owner="Requester" system="ERP" workMinutes="15" approvalRequired="false">
          <trace:evidence ref="ev-001" />
        </trace:auditFields>
      </bpmn:extensionElements>
      <bpmn:incoming>Flow_Start_Capture</bpmn:incoming>
      <bpmn:incoming>Flow_Return_Capture</bpmn:incoming>
      <bpmn:outgoing>Flow_Capture_Review</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:userTask id="UserTask_Review" name="Review requisition">
      <bpmn:incoming>Flow_Capture_Review</bpmn:incoming>
      <bpmn:outgoing>Flow_Review_Gateway</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_Approved" name="Approved?">
      <bpmn:incoming>Flow_Review_Gateway</bpmn:incoming>
      <bpmn:outgoing>Flow_Yes</bpmn:outgoing>
      <bpmn:outgoing>Flow_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:manualTask id="ManualTask_Return" name="Return requisition">
      <bpmn:incoming>Flow_No</bpmn:incoming>
      <bpmn:outgoing>Flow_Return_Capture</bpmn:outgoing>
    </bpmn:manualTask>
    <bpmn:serviceTask id="ServiceTask_CreatePO" name="Create purchase order">
      <bpmn:incoming>Flow_Yes</bpmn:incoming>
      <bpmn:outgoing>Flow_PO_End</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:endEvent id="EndEvent_Issued" name="PO issued">
      <bpmn:incoming>Flow_PO_End</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Start_Capture" sourceRef="StartEvent_Need" targetRef="UserTask_Capture" />
    <bpmn:sequenceFlow id="Flow_Capture_Review" sourceRef="UserTask_Capture" targetRef="UserTask_Review" />
    <bpmn:sequenceFlow id="Flow_Review_Gateway" sourceRef="UserTask_Review" targetRef="Gateway_Approved" />
    <bpmn:sequenceFlow id="Flow_Yes" name="Yes" sourceRef="Gateway_Approved" targetRef="ServiceTask_CreatePO" />
    <bpmn:sequenceFlow id="Flow_No" name="No" sourceRef="Gateway_Approved" targetRef="ManualTask_Return" />
    <bpmn:sequenceFlow id="Flow_Return_Capture" sourceRef="ManualTask_Return" targetRef="UserTask_Capture" />
    <bpmn:sequenceFlow id="Flow_PO_End" sourceRef="ServiceTask_CreatePO" targetRef="EndEvent_Issued" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_Requisition_di" bpmnElement="Participant_Requisition" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="1000" height="420" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Requester_di" bpmnElement="Lane_Requester" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="970" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_LineManager_di" bpmnElement="Lane_LineManager" isHorizontal="true">
        <dc:Bounds x="190" y="220" width="970" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Finance_di" bpmnElement="Lane_Finance" isHorizontal="true">
        <dc:Bounds x="190" y="360" width="970" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_Need_di" bpmnElement="StartEvent_Need">
        <dc:Bounds x="232" y="132" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_Capture_di" bpmnElement="UserTask_Capture">
        <dc:Bounds x="320" y="110" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_Review_di" bpmnElement="UserTask_Review">
        <dc:Bounds x="480" y="250" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Approved_di" bpmnElement="Gateway_Approved" isMarkerVisible="true">
        <dc:Bounds x="640" y="265" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ManualTask_Return_di" bpmnElement="ManualTask_Return">
        <dc:Bounds x="760" y="110" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_CreatePO_di" bpmnElement="ServiceTask_CreatePO">
        <dc:Bounds x="760" y="390" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Issued_di" bpmnElement="EndEvent_Issued">
        <dc:Bounds x="932" y="412" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_Supplier_di" bpmnElement="Participant_Supplier" isHorizontal="true">
        <dc:Bounds x="160" y="570" width="1000" height="60" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Start_Capture_di" bpmnElement="Flow_Start_Capture">
        <di:waypoint x="268" y="150" />
        <di:waypoint x="320" y="150" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Capture_Review_di" bpmnElement="Flow_Capture_Review">
        <di:waypoint x="370" y="190" />
        <di:waypoint x="370" y="290" />
        <di:waypoint x="480" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Review_Gateway_di" bpmnElement="Flow_Review_Gateway">
        <di:waypoint x="580" y="290" />
        <di:waypoint x="640" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Yes_di" bpmnElement="Flow_Yes">
        <di:waypoint x="665" y="315" />
        <di:waypoint x="665" y="430" />
        <di:waypoint x="760" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_No_di" bpmnElement="Flow_No">
        <di:waypoint x="665" y="265" />
        <di:waypoint x="665" y="150" />
        <di:waypoint x="760" y="150" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Return_Capture_di" bpmnElement="Flow_Return_Capture">
        <di:waypoint x="810" y="110" />
        <di:waypoint x="810" y="95" />
        <di:waypoint x="370" y="95" />
        <di:waypoint x="370" y="110" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_PO_End_di" bpmnElement="Flow_PO_End">
        <di:waypoint x="860" y="430" />
        <di:waypoint x="932" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MessageFlow_PO_di" bpmnElement="MessageFlow_PO">
        <di:waypoint x="810" y="470" />
        <di:waypoint x="810" y="570" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`

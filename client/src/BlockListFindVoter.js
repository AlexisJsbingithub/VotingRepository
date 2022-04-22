import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';

export default class BlockListFindVoter extends React.Component {

    constructor(props) {
        super(props);
    }


    render(){
        return(
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card style={{width: '50rem'}}>
                <Card.Header><strong>LIST OF VOTERS</strong></Card.Header>
                <Card.Body>
                    <ListGroup variant="flush">
                    <ListGroup.Item>
                        <Table striped bordered hover>
                        <tbody>
                            {(this.props.listVoters!=null)?this.props.listVoters.map((a) => (<tr><td>{a.returnValues._voterAddress}</td></tr>)):""}
                            <tr></tr>
                        </tbody>
                        </Table>
                    </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
                </Card>
            </div>
        )
    }

}
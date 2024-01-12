import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Table } from "react-bootstrap"
import { fetchRecentlyModifiedDatasets } from '../apis/datasets';




const RecentlyModifiedDetails = ({ }) => {
    const [modifiedDatasets, setModifiedDatasets] = useState([]);

    useEffect(() => {
        async function displayRecentlyModifiedDatasetsModal() {
            try {
                const response = await fetchRecentlyModifiedDatasets();
                setModifiedDatasets(response);
            } catch (error) {
                setModifiedDatasets([]);
                const err = await response.json();
                console.error('Error', err);
            }
        }
        displayRecentlyModifiedDatasetsModal();
    }, [modifiedDatasets.length === 0]);

    const TableRecords = ({ records }) => records.map(record => {
        return (
            <tr>
                <td >
                    <Link href={`/catalog/datasets/detail?id=${record.id}`}>{record.name}</Link>
                </td>
                <td >{record.phase}</td>
                <td >{record.community}</td>
                <td >{record.modifiedBy}</td>
            </tr>
        )
    }
    );

    return (
        <Table borderless striped style={{ width: '100%' }}>
            <thead>
                <tr>
                    <th style={{ width: '25%', fontSize: 17 }} scope="row">Name</th>
                    <th style={{ width: "20%", fontSize: 17 }}>Phase</th>
                    <th style={{ paddingLeft: 2, fontSize: 17 }}>Community</th>
                    <th style={{ fontSize: 17 }}>Modified By</th>
                </tr>
            </thead>
            <tbody>
                <TableRecords records={modifiedDatasets} />
            </tbody>
        </Table>
    )
}

export default RecentlyModifiedDetails;
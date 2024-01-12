global.fetch = require('node-fetch');
/* istanbul ignore file */
const datasetDao = require('../data/datasetDao');
const datasetService = require('./datasetService');
const notificationService = require('../services/notificationService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
    log = logger;
    datasetDao.setLogger(logger);
    datasetService.setLogger(logger);
    notificationService.setLogger(logger);
}

async function getJdcEnhancedDatasetsWithMissingtablesForSpecificDatasets() {
    const datasets = await datasetService.getDatasets(['AVAILABLE']);
    const datasetids = ["287f876d-c6d1-3a33-9f19-b6bb4da84666", "813e878c-acc1-4b98-9eb8-97e230b04d21"];
    return datasets.filter(dataset => {
        return dataSetIdMatch = datasetids.indexOf(dataset.id) !== -1
    });
}

function isNumeric(n) {
    return Number.isInteger(parseInt(n, 10));
}

function simplifyName(name) {
    let prev = '';
    const cleaned = String(name).toLowerCase()
        .replace(/^(com.deere.enterprise.datalake.)(enhance\.|raw\.|model\.|)/g, '')
        .replace(/\./g, '_')
        .replace('@', '_');
    const uniqueList = cleaned.split('_').filter(item => { if (item !== prev || isNumeric(item)) { prev = item; return true; } return false; }).join('_');
    return uniqueList;
}

function getSimpleType(fullType) {
    return simplifyName(fullType);
}

function getSimpleSchemaWithSimpleType(fullSchema, simpleType) {
    return simplifyName(fullSchema).replace(simpleType, '');
}

function getTableName(fullType, fullSchema) {
    const simpleType = getSimpleType(fullType);
    const simpleSchema = getSimpleSchemaWithSimpleType(fullSchema, simpleType);
    return `${simpleType}_${simpleSchema}`.replace(/_$/g, '').replace(/__/g, '_');
}

async function migrateMissingTables(dryrun = true, skipEdl = true) {
    let messages = [];

    const datasetsWithMissingTables = await getJdcEnhancedDatasetsWithMissingtablesForSpecificDatasets();
    log.info('Datasets', JSON.stringify(datasetsWithMissingTables, null, 2));
    messages.push(`found ${datasetsWithMissingTables.length} available EDL Data Catalog datasets with missing tables`);

    await Promise.all(datasetsWithMissingTables.map(async rawDataset => {
        const dataset = await datasetService.getDataset(true, rawDataset.id, rawDataset.version);
        const allSchemas = [...(dataset.schemas || []), ...(dataset.linkedSchemas || [])];
        const tables = dataset.tables || [];
        const newTables = [];
        const corrections = [];

        allSchemas.map(schema => {
            const foundTable = tables.find(({ schemaId }) => schemaId === schema.id);
            if (foundTable) {
                newTables.push(foundTable);
            } else {
                if (!!dataset.environmentName && !!schema.environmentName) {
                    const tableName = getTableName(dataset.environmentName, schema.environmentName);
                    newTables.push({
                        schemaId: schema.id,
                        schemaName: schema.name,
                        schemaVersion: schema.version,
                        tableName: tableName.replace(/(_\d){1,}$/, '')
                    });
                    corrections.push(`${tableName}`);
                }
            }
            rawDataset.tables = newTables;
        });
        if (corrections.length) {
            messages.push(`${dataset.name} tables: [${corrections.length > 10 ? corrections.slice(0, 10).join(', ') : corrections.join(', ')}]`);
        }
    }));

    if (dryrun) {
        messages.push('skipping update step since this is a dry run');
    } else {
        const now = new Date().toISOString();
        await Promise.all(datasetsWithMissingTables.map(async dataset => {
            try {
                const rawDataset = await datasetDao.getDataset(dataset.id, dataset.version);
                const updatedDataset = {
                    ...rawDataset,
                    tables: dataset.tables
                };
                await datasetService.save(updatedDataset);
                if (!skipEdl) {
                    await notificationService.sendDatasetNotification(dataset.id, dataset.name, dataset.version, now);
                }
            } catch (e) {
                messages.push(`failed to save ${dataset.name}`);
                log.error(e);
            }
        }));
        if (skipEdl) {
            messages.push('skipping EDL notifications upon request');
        }
        messages.push(`all datasets have been saved in EDL Data Catalog and notified in EDL`);
    }

    log.info(messages.join('\n'));
    return {steps: messages };
}

module.exports = { setLogger, migrateMissingTables }

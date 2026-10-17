/**
 * ASTROS SIG · registro de cambios y respaldo semanal (Google Apps Script)
 *
 * Instalación (una sola vez, desde una computadora):
 * 1. Abre el SIG en Google Sheets > Extensiones > Apps Script.
 * 2. Borra lo que aparezca, pega este archivo completo y guarda.
 * 3. Arriba elige la función "instalar" y pulsa Ejecutar. Acepta los permisos.
 * Desde ahí cada cambio queda en la hoja "Cambios" y cada lunes se guarda una copia
 * en la carpeta de Drive "ASTROS SIG respaldos" (se conservan las últimas 12).
 */
var HOJA_LOG = 'Cambios';
var CARPETA = 'ASTROS SIG respaldos';
var MAX_RESPALDOS = 12;
var NO_REGISTRAR = ['Cambios', 'Dashboard', 'Control', 'Inicio'];

function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  var ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('registrarCambio').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('respaldoSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
  respaldoSemanal();
  SpreadsheetApp.getUi().alert('Listo: registro de cambios activo y primer respaldo creado en Drive > ' + CARPETA);
}

function registrarCambio(e) {
  if (!e || !e.range) return;
  var hoja = e.range.getSheet();
  if (NO_REGISTRAR.indexOf(hoja.getName()) >= 0) return;
  var log = e.source.getSheetByName(HOJA_LOG);
  if (!log) return;
  var usuario = (e.user && e.user.getEmail && e.user.getEmail()) || Session.getActiveUser().getEmail() || '';
  var unaCelda = e.range.getNumRows() === 1 && e.range.getNumColumns() === 1;
  log.appendRow([
    new Date(),
    usuario,
    hoja.getName(),
    e.range.getA1Notation(),
    unaCelda ? (e.oldValue === undefined ? '' : e.oldValue) : '(varias celdas)',
    unaCelda ? (e.value === undefined ? '' : e.value) : '(varias celdas)',
    ''
  ]);
}

function respaldoSemanal() {
  var ss = SpreadsheetApp.getActive();
  var carpetas = DriveApp.getFoldersByName(CARPETA);
  var carpeta = carpetas.hasNext() ? carpetas.next() : DriveApp.createFolder(CARPETA);
  var nombre = 'ASTROS SIG respaldo ' + Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd HH:mm');
  DriveApp.getFileById(ss.getId()).makeCopy(nombre, carpeta);
  var archivos = [], it = carpeta.getFiles();
  while (it.hasNext()) archivos.push(it.next());
  archivos.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  archivos.slice(MAX_RESPALDOS).forEach(function (f) { f.setTrashed(true); });
  var log = ss.getSheetByName(HOJA_LOG);
  if (log) log.appendRow([new Date(), 'sistema', '-', '-', '', 'Respaldo: ' + nombre, '']);
}

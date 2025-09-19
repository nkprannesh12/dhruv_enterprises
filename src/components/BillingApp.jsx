import React, { useState, useRef } from 'react';
import { Plus, Trash2, Printer, Save, FileText, Percent } from 'lucide-react';
import signatureImage from './image_b545b8.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BillingApp = () => {
  const [invoiceNumber, setInvoiceNumber] = useState(428);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [billToParty, setBillToParty] = useState({ name: '', address: '', gstin: '', code: '' });
  const [shipToParty, setShipToParty] = useState({ name: '', address: '', gstin: '', code: '' });
  
  const [dcNo, setDcNo] = useState('');
  const [poNo, setPoNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  
  const [items, setItems] = useState([
    { id: 1, description: '', hsnCode: '', qty: 0, price: 0, amount: 0 }
  ]);
  
  const [bankDetails, setBankDetails] = useState({ bankAc: '', bankIfsc: '', branch: '' });

  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [igstRate, setIgstRate] = useState(0);

  // New state to control the UI during PDF generation
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const invoiceRef = useRef();

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];
    const convertGroup = (n) => {
      let result = '';
      if (n >= 100) { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
      if (n >= 20) { result += tens[Math.floor(n / 10)] + ' '; n %= 10; }
      else if (n >= 10) { result += teens[n - 10] + ' '; return result; }
      if (n > 0) { result += ones[n] + ' '; }
      return result;
    };
    if (num < 0) return 'Negative ' + numberToWords(-num);
    let result = '';
    let groupIndex = 0;
    while (num > 0) {
      let group;
      if (groupIndex === 0) { group = num % 1000; num = Math.floor(num / 1000); }
      else { group = num % 100; num = Math.floor(num / 100); }
      if (group !== 0) { result = convertGroup(group) + thousands[groupIndex] + ' ' + result; }
      groupIndex++;
    }
    return result.trim() + ' Only';
  };

  const addItem = () => setItems([...items, { id: Date.now(), description: '', hsnCode: '', qty: 0, price: 0, amount: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };
  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'price') {
          const qty = field === 'qty' ? parseFloat(value) || 0 : item.qty;
          const price = field === 'price' ? parseFloat(value) || 0 : item.price;
          updatedItem.amount = qty * price;
        }
        return updatedItem;
      }
      return item;
    }));
  };
  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const cgst = subTotal * (cgstRate / 100);
    const sgst = subTotal * (sgstRate / 100);
    const igst = subTotal * (igstRate / 100);
    const total = subTotal + cgst + sgst + igst;
    return { subTotal, cgst, sgst, igst, total };
  };
  const { subTotal, cgst, sgst, igst, total } = calculateTotals();
  const generateNewInvoice = () => {
    setInvoiceNumber(prev => prev + 1);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setBillToParty({ name: '', address: '', gstin: '', code: '' });
    setShipToParty({ name: '', address: '', gstin: '', code: '' });
    setDcNo(''); setPoNo(''); setVehicleNo('');
    setItems([{ id: 1, description: '', hsnCode: '', qty: 0, price: 0, amount: 0 }]);
  };
  const handlePrint = () => window.print();
  
  // Updated PDF generation logic
  const handleSaveAsPDF = () => {
    setIsSavingPdf(true); // Switch to "clean" UI
    
    setTimeout(() => { // Allow time for the UI to re-render
      html2canvas(invoiceRef.current, { scale: 2 })
        .then((canvas) => {
          const imageData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const canvasAspectRatio = canvas.width / canvas.height;
          const finalCanvasHeight = pdfWidth / canvasAspectRatio;
          
          pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, finalCanvasHeight);
          pdf.save(`invoice-${invoiceNumber}.pdf`);
        })
        .finally(() => {
          setIsSavingPdf(false); // Switch back to the interactive UI
        });
    }, 50);
  };

  const copyShipToParty = () => setShipToParty({ ...billToParty });

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: A4; margin: 1cm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-xl font-bold flex items-center gap-2 self-center">
                <FileText size={24} /> Dhruv Enterprises - Billing System
              </h1>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button onClick={generateNewInvoice} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded flex items-center justify-center gap-2">
                  <Plus size={18} /> New Bill
                </button>
                <button onClick={handlePrint} className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded flex items-center justify-center gap-2">
                  <Printer size={18} /> Print
                </button>
                <button onClick={handleSaveAsPDF} className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded flex items-center justify-center gap-2">
                  <Save size={18} /> Save as PDF
                </button>
              </div>
            </div>
          </div>

          <div ref={invoiceRef} className="p-4 sm:p-6 bg-white" id="invoice-content">
            <div className="border-2 border-black mb-4">
              <div className="text-center text-xs p-1 border-b-2 border-black">
                Certified that the particulars given above are true and correct
              </div>
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-4 border-b-2 sm:border-b-0 sm:border-r-2 border-black">
                  <h2 className="text-xl font-bold text-center mb-2">Dhruv Enterprises</h2>
                  <div className="text-sm space-y-1">
                    <p>120 I, Bangalow Street, Neikarapatti (Po),</p>
                    <p>Palani(Tk), Dindigul (Dt),Tamil Nadu.</p>
                    <p>Cell : 8778489020</p>
                    <p>e-mail : dhruvvinayak1421@gmail.com</p>
                    <p><strong>GST NO :</strong> 33EMUPK6767C1ZL</p>
                    <p><strong>E-way Bill NO :</strong></p>
                  </div>
                </div>
                <div className="w-full sm:w-2/5 p-4 text-center">
                  <h3 className="text-lg font-bold mb-4">TAX INVOICE</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span><strong>INVOICE NO :</strong></span>
                      <input type="number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={isSavingPdf ? 'hidden' : "w-24 text-right outline-none print:hidden border-b border-gray-300"} />
                      <span className={isSavingPdf ? 'inline' : 'hidden print:inline'}>{invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span><strong>INVOICE DATE :</strong></span>
                      <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={isSavingPdf ? 'hidden' : "text-right outline-none print:hidden border-b border-gray-300"}/>
                      <span className={isSavingPdf ? 'inline' : 'hidden print:inline'}>{new Date(invoiceDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span><strong>DC NO :</strong></span>
                       <input type="text" value={dcNo} onChange={(e) => setDcNo(e.target.value)} className={isSavingPdf ? 'hidden' : "w-24 text-right outline-none print:hidden border-b border-gray-300"}/>
                      <span className={isSavingPdf ? 'inline' : 'hidden print:inline'}>{dcNo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span><strong>PO NO :</strong></span>
                      <input type="text" value={poNo} onChange={(e) => setPoNo(e.target.value)} className={isSavingPdf ? 'hidden' : "w-24 text-right outline-none print:hidden border-b border-gray-300"}/>
                      <span className={isSavingPdf ? 'inline' : 'hidden print:inline'}>{poNo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span><strong>VEHICLE NO:</strong></span>
                      <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className={isSavingPdf ? 'hidden' : "w-24 text-right outline-none print:hidden border-b border-gray-300"}/>
                      <span className={isSavingPdf ? 'inline' : 'hidden print:inline'}>{vehicleNo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-2 border-black mb-4">
              <div className="flex bg-yellow-200">
                <div className="flex-1 p-2 border-r border-black"><h4 className="font-bold text-center">BILL TO PARTY</h4></div>
                <div className="flex-1 p-2"><h4 className="font-bold text-center">SHIP TO PARTY</h4></div>
              </div>
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-4 border-b-2 sm:border-b-0 sm:border-r-2 border-black">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold">Name:</label>
                      <input type="text" value={billToParty.name} onChange={(e) => setBillToParty({...billToParty, name: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none"} placeholder="Enter party name"/>
                      <p className={isSavingPdf ? 'block' : 'hidden'}>{billToParty.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">Address:</label>
                      <textarea value={billToParty.address} onChange={(e) => setBillToParty({...billToParty, address: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none resize-none"} rows="2" placeholder="Enter address"/>
                      <p className={isSavingPdf ? 'block whitespace-pre-wrap' : 'hidden'}>{billToParty.address}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">GSTIN:</label>
                      <input type="text" value={billToParty.gstin} onChange={(e) => setBillToParty({...billToParty, gstin: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none"} placeholder="Enter GSTIN"/>
                      <p className={isSavingPdf ? 'block' : 'hidden'}>{billToParty.gstin}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">CODE:</label>
                      <input type="text" value={billToParty.code} onChange={(e) => setBillToParty({...billToParty, code: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none"} placeholder="Enter code"/>
                      <p className={isSavingPdf ? 'block' : 'hidden'}>{billToParty.code}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-end items-center">
                      <button onClick={copyShipToParty} className={isSavingPdf ? 'hidden' : "text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded print:hidden"}>Copy from Bill To</button>
                    </div>
                     <label className="text-xs font-semibold">Name:</label>
                    <input type="text" value={shipToParty.name} onChange={(e) => setShipToParty({...shipToParty, name: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none"} placeholder="Enter party name"/>
                    <p className={isSavingPdf ? 'block' : 'hidden'}>{shipToParty.name}</p>
                    <div>
                      <label className="text-xs font-semibold">Address:</label>
                      <textarea value={shipToParty.address} onChange={(e) => setShipToParty({...shipToParty, address: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none resize-none"} rows="2" placeholder="Enter address"/>
                      <p className={isSavingPdf ? 'block whitespace-pre-wrap' : 'hidden'}>{shipToParty.address}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">GSTIN:</label>
                      <input type="text" value={shipToParty.gstin} onChange={(e) => setShipToParty({...shipToParty, gstin: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none"} placeholder="Enter GSTIN"/>
                      <p className={isSavingPdf ? 'block' : 'hidden'}>{shipToParty.gstin}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">CODE:</label>
                      <input type="text" value={shipToParty.code} onChange={(e) => setShipToParty({...shipToParty, code: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b border-gray-300 outline-none"} placeholder="Enter code"/>
                      <p className={isSavingPdf ? 'block' : 'hidden'}>{shipToParty.code}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-2 border-black mb-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-yellow-200">
                    <tr>
                      <th className="border border-black p-2 text-sm w-12">S.No.</th>
                      <th className="border border-black p-2 text-sm">Product Description</th>
                      <th className="border border-black p-2 text-sm w-24">HSN CODE</th>
                      <th className="border border-black p-2 text-sm w-16">QTY</th>
                      <th className="border border-black p-2 text-sm w-24">PRICE</th>
                      <th className="border border-black p-2 text-sm w-24">AMOUNT</th>
                      <th className={`border border-black p-2 text-sm print:hidden w-14 ${isSavingPdf ? 'hidden' : ''}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-black p-2 text-center text-sm">{index + 1}</td>
                        <td className="border border-black p-1"><input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full outline-none text-sm print:bg-transparent p-1" placeholder="Product description"/></td>
                        <td className="border border-black p-1"><input type="text" value={item.hsnCode} onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)} className="w-full outline-none text-sm text-center print:bg-transparent p-1" placeholder="HSN"/></td>
                        <td className="border border-black p-1"><input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} className="w-full outline-none text-sm text-center print:bg-transparent p-1" placeholder="0"/></td>
                        <td className="border border-black p-1"><input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} className="w-full outline-none text-sm text-right print:bg-transparent p-1" placeholder="0.00"/></td>
                        <td className="border border-black p-2 text-right text-sm">{item.amount.toFixed(2)}</td>
                        <td className={`border border-black p-2 text-center print:hidden ${isSavingPdf ? 'hidden' : ''}`}><button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={items.length === 1}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, index) => ( <tr key={`empty-${index}`} className="h-8"><td className="border border-black p-2">&nbsp;</td><td className="border border-black p-2">&nbsp;</td><td className="border border-black p-2">&nbsp;</td><td className="border border-black p-2">&nbsp;</td><td className="border border-black p-2">&nbsp;</td><td className="border border-black p-2">&nbsp;</td><td className={`border border-black p-2 print:hidden ${isSavingPdf ? 'hidden' : ''}`}>&nbsp;</td></tr>))}
                  </tbody>
                </table>
              </div>
              <div className={`flex print:hidden p-2 border-t border-black ${isSavingPdf ? 'hidden' : ''}`}><button onClick={addItem} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded flex items-center gap-2 text-sm"><Plus size={16} />Add Item</button></div>
            </div>

            <div className="flex flex-col md:flex-row border-2 border-black">
              <div className="flex-1 p-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-2">BANK DETAILS</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <strong className="w-20">Bank A/C:</strong>
                        <input type="text" value={bankDetails.bankAc} onChange={(e) => setBankDetails({...bankDetails, bankAc: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b print:hidden"} placeholder="Enter bank account"/>
                        <span className={isSavingPdf ? 'inline' : 'hidden'}>{bankDetails.bankAc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="w-20">Bank IFSC:</strong>
                        <input type="text" value={bankDetails.bankIfsc} onChange={(e) => setBankDetails({...bankDetails, bankIfsc: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b print:hidden"} placeholder="Enter IFSC code"/>
                         <span className={isSavingPdf ? 'inline' : 'hidden'}>{bankDetails.bankIfsc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="w-20">Branch:</strong>
                        <input type="text" value={bankDetails.branch} onChange={(e) => setBankDetails({...bankDetails, branch: e.target.value})} className={isSavingPdf ? 'hidden' : "w-full border-b print:hidden"} placeholder="Enter branch"/>
                         <span className={isSavingPdf ? 'inline' : 'hidden'}>{bankDetails.branch}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Terms & Conditions</h4>
                    <p className="text-xs">Subject to 'Dindigul' Jurisdiction</p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-2/5">
                <table className="w-full text-sm h-full">
                  <tbody>
                    <tr>
                      <td className="border-b border-black p-1 font-bold">Sub Total</td>
                      <td className="border-b border-black p-1 text-right">{subTotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-black p-1">CGST @{cgstRate}%</td>
                      <td className="border-b border-black p-1 text-right">{cgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                       <td className="border-b border-black p-1">SGST @{sgstRate}%</td>
                       <td className="border-b border-black p-1 text-right">{sgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-black p-1">IGST @{igstRate}%</td>
                      <td className="border-b border-black p-1 text-right">{igst.toFixed(2)}</td>
                    </tr>
                     <tr>
                      <td className="p-1 font-bold bg-yellow-200">Total Amount</td>
                      <td className="p-1 text-right font-bold bg-yellow-200">{total.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="p-1 font-bold border-t border-black" colSpan="2">
                          <span className="text-xs">Amount in Words: </span>
                          <span className="text-xs font-normal">{numberToWords(Math.round(total))}</span>
                        </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-2 border-black border-t-0">
              <div className="flex">
                <div className="flex-1 p-4 border-r border-black text-center">
                  <div className="h-24 flex items-end justify-center">
                    <p className="font-bold text-sm">COMMON SEAL</p>
                  </div>
                </div>
                <div className="flex-1 p-4 text-center">
                  <div className="h-24 flex flex-col justify-between">
                    <div className="flex-grow flex items-center justify-center">
                      <img src={signatureImage} alt="Signature" className="h-12" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">FOR: Dhruv Enterprises</p>
                      <p className="font-bold text-sm">AUTHORIZED SIGNATORY</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-4 p-4 bg-gray-800 text-white rounded-lg print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="text-yellow-400" size={20} />
                <span className="font-semibold">Tax Rates:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm flex-1"><label htmlFor="cgst" className="font-medium w-12">CGST:</label><input id="cgst" type="number" value={cgstRate} onChange={e => setCgstRate(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded bg-gray-600 text-white text-center"/><span>%</span></div>
                <div className="flex items-center gap-2 text-sm flex-1"><label htmlFor="sgst" className="font-medium w-12">SGST:</label><input id="sgst" type="number" value={sgstRate} onChange={e => setSgstRate(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded bg-gray-600 text-white text-center"/><span>%</span></div>
                <div className="flex items-center gap-2 text-sm flex-1"><label htmlFor="igst" className="font-medium w-12">IGST:</label><input id="igst" type="number" value={igstRate} onChange={e => setIgstRate(parseFloat(e.target.value) || 0)} className="w-full p-1 rounded bg-gray-600 text-white text-center"/><span>%</span></div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-6 bg-gray-700 p-3 rounded-md">
              <div className="text-sm"><span>Subtotal: </span><span className="font-bold">₹{subTotal.toFixed(2)}</span></div>
              <div className="text-lg">
                <span className="font-semibold">TOTAL: </span>
                <span className="font-bold text-yellow-400 text-xl">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingApp;


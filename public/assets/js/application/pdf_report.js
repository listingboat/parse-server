function PdfReportModule() {// module to handle generation and download of workstyle pdf report
    var thisInstance = this;

    thisInstance.constants = {  // constants
        selector: {
            printReportBtn: '.js_print_report_btn',
            modalDownloadButton: '.js_download_report',
            modal: '#print-report-modal',
            loader: '.js-full-page-loader'
        },
        class: {}
    };

    thisInstance.init = function (options) {
        var downloadPdf = options.downloadPdf;
        jsPDF.API.centerText = function(txt, size) {
            var fontSize = this.internal.getFontSize();
            var pageWidth = this.internal.pageSize.width * size;
            var txtWidth = this.getStringUnitWidth(txt) * fontSize / this.internal.scaleFactor;
            // Calculate text's x coordinate
            var x = (pageWidth - txtWidth) / 2;
            return {
                text: txt,
                x: x
            };
        };
        printReportButtonBinding(); // Bindings for click of print report button
        if (downloadPdf)
            getReportData();
    };

    // Function to generate pdf from the html templates.
    function generatePDF(data, successCallBack) {

        var pdf = new jsPDF('p', 'pt', 'a4'),
            options = {
                background: '#fff',
                logging: true
            },
            firstName, lastName, occupation, textColor;

        // Add the html to dom
        $('.js_pdf_report').removeClass('hide').append(data.userDetailsPage + data.coverPage + data.distributionPage + data.personalityDetailsPage + data.personalityMattersPage);
        $('.js_pdf_page').imagesLoaded(function() {
                firstName = $.trim($('#user_first_name').val());
                lastName = $.trim($('#user_last_name').val());
                occupation = $.trim($('#user_occupation').val());
                textColor = $.trim($('#text_color').val()).split(',');

                // Add cover page to pdf
                pdf.addHTML($('#user_details'), 0, 270, options, function () {
                    // add name to cover page
                    pdf.setFontType("normal");
                    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
                    pdf.setFontSize(27);
                    var info = pdf.centerText(firstName + " " + lastName, 1);
                    pdf.text(info.x, 550, info.text);

                    // add occupation to cover page
                    pdf.setTextColor(127, 128, 131);
                    pdf.setFontSize(21);
                    var info2 = pdf.centerText(occupation, 1);
                    pdf.text(info2.x, 580, info2.text);

                    pdf.addPage();

                    // add User Personality details page to pdf
                    pdf.addHTML($('#user_personality'), options, function () {
                        // add name and occupation to page
                        pdf.setFontType("normal");
                        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
                        pdf.setFontSize(16);
                        var info3 = pdf.centerText(firstName + " " + lastName + ', ' + occupation, .75);
                        pdf.text(info3.x, 370, info3.text);
                        pdf.addPage();

                        // add hang your workstyle page to pdf
                        pdf.addHTML($('#cover_page'), options, function () {
                            pdf.addPage();

                            // add personality details page to pdf
                            pdf.addHTML($('#personality_description'), options, function () {
                                // add page header with User's first name to pdf
                                var text = firstName + ", by identifying your workstyle, you've taken a big leap in understanding yourself and becoming a master communicator. Now keep training with workstyle to master communicating with all six workstyles.";
                                pdf.setTextColor(127, 128, 131);
                                pdf.setFontType("normal");
                                pdf.setFontSize(12);
                                var splitText = pdf.splitTextToSize(text, 500);
                                pdf.text(40, 100, splitText);
                                pdf.addPage();

                                // add workstyle distribution chart page to pdf
                                pdf.addHTML($('#distribution_page'), options, function () {
                                    successCallBack(pdf);
                                });

                            });
                        });
                    });

                });
            });
    }

    // Function to make ajax call and get pdf pages templates
    function getReportData() {
        var selectors = thisInstance.constants.selector,
            $loader = $(selectors.loader),
            url = $(selectors.printReportBtn).data('get_report_url');
        $loader.removeClass('hide');
        $.ajax({
            type: 'GET',
            url: url,
            success: function (data) {
                if (data.success) {
                    generatePDF(data, function (pdf) {
                        $('.js_pdf_report').html("").addClass('hide');
                        $loader.addClass('hide');
                        $(selectors.modal).modal('show');
                        $(selectors.modalDownloadButton).off('click').on('click', function () {
                            // download pdf
                            pdf.save('workstyle_personality_report.pdf');
                        });
                    });
                }
            }, error: function (error) {
                $loader.addClass('hide');
            }
        });
    }

    function printReportButtonBinding() {
        var selectors = thisInstance.constants.selector,
            $loader = $(selectors.loader);

        $(selectors.printReportBtn).on('click', getReportData);
    }

}

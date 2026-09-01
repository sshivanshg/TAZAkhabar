using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TazaKhabar.Api.Migrations
{
    /// <inheritdoc />
    public partial class DeepenLocalPublisherSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 2001, 1, "https://www.amarujala.com/rss/agra.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2002, 3, "https://www.amarujala.com/rss/kanpur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2003, 4, "https://www.amarujala.com/rss/lucknow.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2004, 5, "https://www.amarujala.com/rss/delhi-ncr.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2005, 10, "https://www.amarujala.com/rss/kolkata.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2006, 14, "https://www.amarujala.com/rss/jaipur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2007, 15, "https://www.amarujala.com/rss/chandigarh.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2008, 16, "https://www.amarujala.com/rss/indore.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2009, 17, "https://www.amarujala.com/rss/bhopal.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2010, 18, "https://www.amarujala.com/rss/patna.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2011, 19, "https://www.amarujala.com/rss/ranchi.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2012, 21, "https://www.amarujala.com/rss/guwahati.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2013, 35, "https://www.amarujala.com/rss/varanasi.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2014, 36, "https://www.amarujala.com/rss/allahabad.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2015, 37, "https://www.amarujala.com/rss/meerut.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2016, 38, "https://www.amarujala.com/rss/bareilly.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2017, 39, "https://www.amarujala.com/rss/gorakhpur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2018, 40, "https://www.amarujala.com/rss/dehradun.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2019, 41, "https://www.amarujala.com/rss/haridwar.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2020, 42, "https://www.amarujala.com/rss/shimla.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2021, 43, "https://www.amarujala.com/rss/jammu.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2022, 44, "https://www.amarujala.com/rss/srinagar.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2023, 45, "https://www.amarujala.com/rss/amritsar.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2024, 46, "https://www.amarujala.com/rss/ludhiana.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2025, 48, "https://www.amarujala.com/rss/raipur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2026, 64, "https://www.amarujala.com/rss/agartala.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2027, 65, "https://www.amarujala.com/rss/shillong.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2028, 67, "https://www.amarujala.com/rss/aizwal.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2029, 68, "https://www.amarujala.com/rss/kohima.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2030, 69, "https://www.amarujala.com/rss/gangtok.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2031, 70, "https://www.amarujala.com/rss/itanagar.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2032, 72, "https://www.amarujala.com/rss/noida.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2033, 73, "https://www.amarujala.com/rss/ghaziabad.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2034, 74, "https://www.amarujala.com/rss/faridabad.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2035, 34, "https://www.amarujala.com/rss/udaipur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2036, 33, "https://www.amarujala.com/rss/jodhpur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 2101, 1, "https://www.bhaskar.com/local/uttar-pradesh/agra/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2102, 3, "https://www.bhaskar.com/local/uttar-pradesh/kanpur/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2103, 4, "https://www.bhaskar.com/local/uttar-pradesh/lucknow/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2104, 35, "https://www.bhaskar.com/local/uttar-pradesh/varanasi/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2105, 36, "https://www.bhaskar.com/local/uttar-pradesh/allahabad/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2106, 37, "https://www.bhaskar.com/local/uttar-pradesh/meerut/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2107, 38, "https://www.bhaskar.com/local/uttar-pradesh/bareilly/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2108, 39, "https://www.bhaskar.com/local/uttar-pradesh/gorakhpur/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2109, 16, "https://www.bhaskar.com/local/madhya-pradesh/indore/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2110, 17, "https://www.bhaskar.com/local/madhya-pradesh/bhopal/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2111, 14, "https://www.bhaskar.com/local/rajasthan/jaipur/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2112, 33, "https://www.bhaskar.com/local/rajasthan/jodhpur/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2113, 34, "https://www.bhaskar.com/local/rajasthan/udaipur/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2114, 18, "https://www.bhaskar.com/local/bihar/patna/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2115, 19, "https://www.bhaskar.com/local/jharkhand/ranchi/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2116, 48, "https://www.bhaskar.com/local/chhattisgarh/raipur/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2117, 40, "https://www.bhaskar.com/local/uttarakhand/dehradun/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2118, 41, "https://www.bhaskar.com/local/uttarakhand/haridwar/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" },
                    { 2201, 6, "https://timesofindia.indiatimes.com/city/mumbai", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2202, 7, "https://timesofindia.indiatimes.com/city/bangalore", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2203, 8, "https://timesofindia.indiatimes.com/city/hyderabad", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2204, 9, "https://timesofindia.indiatimes.com/city/chennai", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2205, 10, "https://timesofindia.indiatimes.com/city/kolkata", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2206, 11, "https://timesofindia.indiatimes.com/city/pune", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2207, 12, "https://timesofindia.indiatimes.com/city/ahmedabad", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2208, 13, "https://timesofindia.indiatimes.com/city/surat", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2209, 14, "https://timesofindia.indiatimes.com/city/jaipur", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2210, 15, "https://timesofindia.indiatimes.com/city/chandigarh", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2211, 16, "https://timesofindia.indiatimes.com/city/indore", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2212, 17, "https://timesofindia.indiatimes.com/city/bhopal", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2213, 18, "https://timesofindia.indiatimes.com/city/patna", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2214, 19, "https://timesofindia.indiatimes.com/city/ranchi", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2215, 20, "https://timesofindia.indiatimes.com/city/bhubaneswar", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2216, 21, "https://timesofindia.indiatimes.com/city/guwahati", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2217, 22, "https://timesofindia.indiatimes.com/city/kochi", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2218, 23, "https://timesofindia.indiatimes.com/city/thiruvananthapuram", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2219, 25, "https://timesofindia.indiatimes.com/city/coimbatore", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2220, 26, "https://timesofindia.indiatimes.com/city/madurai", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2221, 27, "https://timesofindia.indiatimes.com/city/visakhapatnam", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2222, 28, "https://timesofindia.indiatimes.com/city/vijayawada", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2223, 29, "https://timesofindia.indiatimes.com/city/nagpur", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2224, 30, "https://timesofindia.indiatimes.com/city/nashik", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2225, 31, "https://timesofindia.indiatimes.com/city/vadodara", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2226, 32, "https://timesofindia.indiatimes.com/city/rajkot", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2227, 45, "https://timesofindia.indiatimes.com/city/amritsar", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2228, 46, "https://timesofindia.indiatimes.com/city/ludhiana", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2229, 55, "https://timesofindia.indiatimes.com/city/mangalore", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2230, 56, "https://timesofindia.indiatimes.com/city/mysore", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2231, 61, "https://timesofindia.indiatimes.com/city/trichy", true, "CityEdition", "en", null, null, null, "Times of India", null, "Scrape" },
                    { 2301, 6, "https://news.google.com/rss/search?q=Mumbai%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2302, 7, "https://news.google.com/rss/search?q=Bengaluru%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2303, 8, "https://news.google.com/rss/search?q=Hyderabad%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2304, 9, "https://news.google.com/rss/search?q=Chennai%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2305, 10, "https://news.google.com/rss/search?q=Kolkata%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2306, 11, "https://news.google.com/rss/search?q=Pune%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2307, 12, "https://news.google.com/rss/search?q=Ahmedabad%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2308, 20, "https://news.google.com/rss/search?q=Bhubaneswar%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2309, 27, "https://news.google.com/rss/search?q=Visakhapatnam%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 2310, 29, "https://news.google.com/rss/search?q=Nagpur%20when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                });

            // Down deletes: 2001 - 2310

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1006,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Mumbai%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1007,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bengaluru%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1008,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Hyderabad%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1009,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Chennai%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1010,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kolkata%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1011,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Pune%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1012,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ahmedabad%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1013,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Surat%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1014,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jaipur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1015,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Chandigarh%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1016,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Indore%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1017,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bhopal%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1018,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Patna%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1019,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ranchi%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1020,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bhubaneswar%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1021,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Guwahati%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1022,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kochi%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1023,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Thiruvananthapuram%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1024,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kozhikode%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1025,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Coimbatore%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1026,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Madurai%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1027,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Visakhapatnam%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1028,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Vijayawada%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1029,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Nagpur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1030,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Nashik%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1031,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Vadodara%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1032,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Rajkot%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1033,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jodhpur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1034,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Udaipur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1035,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Varanasi%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1036,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Prayagraj%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1037,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Meerut%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1038,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bareilly%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1039,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Gorakhpur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1040,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Dehradun%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1041,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Haridwar%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1042,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Shimla%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1043,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jammu%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1044,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Srinagar%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1045,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Amritsar%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1046,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ludhiana%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1047,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jalandhar%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1048,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Raipur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1049,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bilaspur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1050,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jamshedpur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1051,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Dhanbad%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1052,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Siliguri%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1053,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Durgapur%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1054,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Cuttack%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1055,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Mangaluru%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1056,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Mysuru%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1057,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Hubballi%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1058,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Warangal%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1059,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Tirupati%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1060,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Salem%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1061,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Tiruchirappalli%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1062,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Puducherry%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1063,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Panaji%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1064,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Agartala%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1065,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Shillong%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1066,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Imphal%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1067,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Aizawl%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1068,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kohima%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1069,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Gangtok%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1070,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Itanagar%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1071,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Port%20Blair%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1072,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Gurugram%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1073,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Noida%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1074,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ghaziabad%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1075,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Faridabad%20when%3A7d&hl=hi&gl=IN&ceid=IN:hi");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2001);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2002);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2003);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2004);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2005);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2006);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2007);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2008);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2009);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2010);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2011);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2012);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2013);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2014);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2015);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2016);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2017);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2018);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2019);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2020);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2021);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2022);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2023);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2024);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2025);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2026);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2027);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2028);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2029);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2030);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2031);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2032);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2033);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2034);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2035);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2036);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2037);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2038);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2039);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2040);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2041);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2042);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2043);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2044);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2045);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2046);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2047);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2048);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2049);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2050);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2051);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2052);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2053);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2054);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2055);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2056);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2057);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2058);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2059);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2060);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2061);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2062);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2063);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2064);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2065);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2066);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2067);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2068);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2069);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2070);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2071);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2072);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2073);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2074);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2075);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2076);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2077);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2078);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2079);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2080);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2081);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2082);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2083);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2084);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2085);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2086);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2087);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2088);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2089);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2090);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2091);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2092);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2093);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2094);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2095);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2096);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2097);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2098);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2099);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2100);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2101);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2102);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2103);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2104);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2105);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2106);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2107);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2108);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2109);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2110);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2111);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2112);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2113);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2114);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2115);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2116);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2117);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2118);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2119);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2120);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2121);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2122);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2123);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2124);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2125);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2126);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2127);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2128);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2129);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2130);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2131);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2132);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2133);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2134);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2135);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2136);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2137);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2138);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2139);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2140);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2141);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2142);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2143);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2144);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2145);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2146);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2147);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2148);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2149);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2150);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2151);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2152);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2153);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2154);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2155);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2156);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2157);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2158);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2159);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2160);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2161);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2162);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2163);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2164);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2165);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2166);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2167);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2168);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2169);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2170);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2171);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2172);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2173);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2174);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2175);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2176);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2177);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2178);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2179);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2180);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2181);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2182);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2183);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2184);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2185);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2186);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2187);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2188);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2189);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2190);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2191);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2192);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2193);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2194);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2195);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2196);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2197);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2198);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2199);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2200);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2201);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2202);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2203);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2204);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2205);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2206);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2207);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2208);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2209);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2210);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2211);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2212);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2213);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2214);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2215);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2216);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2217);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2218);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2219);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2220);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2221);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2222);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2223);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2224);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2225);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2226);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2227);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2228);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2229);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2230);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2231);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2232);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2233);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2234);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2235);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2236);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2237);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2238);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2239);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2240);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2241);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2242);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2243);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2244);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2245);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2246);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2247);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2248);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2249);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2250);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2251);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2252);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2253);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2254);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2255);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2256);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2257);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2258);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2259);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2260);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2261);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2262);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2263);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2264);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2265);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2266);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2267);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2268);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2269);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2270);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2271);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2272);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2273);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2274);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2275);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2276);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2277);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2278);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2279);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2280);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2281);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2282);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2283);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2284);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2285);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2286);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2287);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2288);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2289);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2290);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2291);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2292);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2293);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2294);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2295);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2296);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2297);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2298);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2299);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2300);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2301);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2302);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2303);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2304);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2305);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2306);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2307);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2308);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2309);
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2310);
            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1006,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Mumbai&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1007,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bengaluru&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1008,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Hyderabad&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1009,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Chennai&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1010,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kolkata&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1011,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Pune&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1012,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ahmedabad&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1013,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Surat&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1014,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jaipur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1015,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Chandigarh&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1016,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Indore&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1017,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bhopal&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1018,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Patna&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1019,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ranchi&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1020,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bhubaneswar&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1021,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Guwahati&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1022,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kochi&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1023,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Thiruvananthapuram&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1024,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kozhikode&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1025,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Coimbatore&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1026,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Madurai&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1027,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Visakhapatnam&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1028,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Vijayawada&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1029,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Nagpur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1030,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Nashik&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1031,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Vadodara&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1032,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Rajkot&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1033,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jodhpur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1034,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Udaipur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1035,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Varanasi&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1036,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Prayagraj&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1037,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Meerut&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1038,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bareilly&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1039,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Gorakhpur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1040,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Dehradun&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1041,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Haridwar&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1042,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Shimla&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1043,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jammu&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1044,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Srinagar&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1045,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Amritsar&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1046,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ludhiana&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1047,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jalandhar&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1048,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Raipur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1049,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Bilaspur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1050,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Jamshedpur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1051,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Dhanbad&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1052,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Siliguri&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1053,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Durgapur&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1054,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Cuttack&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1055,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Mangaluru&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1056,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Mysuru&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1057,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Hubballi&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1058,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Warangal&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1059,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Tirupati&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1060,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Salem&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1061,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Tiruchirappalli&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1062,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Puducherry&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1063,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Panaji&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1064,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Agartala&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1065,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Shillong&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1066,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Imphal&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1067,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Aizawl&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1068,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Kohima&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1069,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Gangtok&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1070,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Itanagar&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1071,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Port%20Blair&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1072,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Gurugram&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1073,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Noida&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1074,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Ghaziabad&hl=hi&gl=IN&ceid=IN:hi");

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1075,
                column: "feed_url",
                value: "https://news.google.com/rss/search?q=Faridabad&hl=hi&gl=IN&ceid=IN:hi");
        }
    }
}

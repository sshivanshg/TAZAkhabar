using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TazaKhabar.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandIndiaCityCoverage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "latitude",
                table: "cities",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                table: "cities",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.UpdateData(
                table: "cities",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "latitude", "longitude" },
                values: new object[] { 27.1767, 78.008099999999999 });

            migrationBuilder.UpdateData(
                table: "cities",
                keyColumn: "id",
                keyValue: 2,
                columns: new[] { "latitude", "longitude" },
                values: new object[] { 25.448399999999999, 78.5685 });

            migrationBuilder.UpdateData(
                table: "cities",
                keyColumn: "id",
                keyValue: 3,
                columns: new[] { "latitude", "longitude" },
                values: new object[] { 26.4499, 80.331900000000005 });

            migrationBuilder.UpdateData(
                table: "cities",
                keyColumn: "id",
                keyValue: 4,
                columns: new[] { "latitude", "longitude" },
                values: new object[] { 26.846699999999998, 80.946200000000005 });

            migrationBuilder.UpdateData(
                table: "cities",
                keyColumn: "id",
                keyValue: 5,
                columns: new[] { "latitude", "longitude" },
                values: new object[] { 28.613900000000001, 77.209000000000003 });

            migrationBuilder.InsertData(
                table: "cities",
                columns: new[] { "id", "latitude", "longitude", "name", "slug", "state" },
                values: new object[,]
                {
                    { 6, 19.076000000000001, 72.877700000000004, "Mumbai", "mumbai", "Maharashtra" },
                    { 7, 12.9716, 77.5946, "Bengaluru", "bengaluru", "Karnataka" },
                    { 8, 17.385000000000002, 78.486699999999999, "Hyderabad", "hyderabad", "Telangana" },
                    { 9, 13.082700000000001, 80.270700000000005, "Chennai", "chennai", "Tamil Nadu" },
                    { 10, 22.572600000000001, 88.363900000000001, "Kolkata", "kolkata", "West Bengal" },
                    { 11, 18.520399999999999, 73.856700000000004, "Pune", "pune", "Maharashtra" },
                    { 12, 23.022500000000001, 72.571399999999997, "Ahmedabad", "ahmedabad", "Gujarat" },
                    { 13, 21.170200000000001, 72.831100000000006, "Surat", "surat", "Gujarat" },
                    { 14, 26.912400000000002, 75.787300000000002, "Jaipur", "jaipur", "Rajasthan" },
                    { 15, 30.7333, 76.779399999999995, "Chandigarh", "chandigarh", "Chandigarh" },
                    { 16, 22.7196, 75.857699999999994, "Indore", "indore", "Madhya Pradesh" },
                    { 17, 23.259899999999998, 77.412599999999998, "Bhopal", "bhopal", "Madhya Pradesh" },
                    { 18, 25.594100000000001, 85.137600000000006, "Patna", "patna", "Bihar" },
                    { 19, 23.344100000000001, 85.309600000000003, "Ranchi", "ranchi", "Jharkhand" },
                    { 20, 20.296099999999999, 85.8245, "Bhubaneswar", "bhubaneswar", "Odisha" },
                    { 21, 26.144500000000001, 91.736199999999997, "Guwahati", "guwahati", "Assam" },
                    { 22, 9.9312000000000005, 76.267300000000006, "Kochi", "kochi", "Kerala" },
                    { 23, 8.5241000000000007, 76.936599999999999, "Thiruvananthapuram", "thiruvananthapuram", "Kerala" },
                    { 24, 11.258800000000001, 75.7804, "Kozhikode", "kozhikode", "Kerala" },
                    { 25, 11.0168, 76.955799999999996, "Coimbatore", "coimbatore", "Tamil Nadu" },
                    { 26, 9.9252000000000002, 78.119799999999998, "Madurai", "madurai", "Tamil Nadu" },
                    { 27, 17.686800000000002, 83.218500000000006, "Visakhapatnam", "visakhapatnam", "Andhra Pradesh" },
                    { 28, 16.5062, 80.647999999999996, "Vijayawada", "vijayawada", "Andhra Pradesh" },
                    { 29, 21.145800000000001, 79.088200000000001, "Nagpur", "nagpur", "Maharashtra" },
                    { 30, 19.997499999999999, 73.7898, "Nashik", "nashik", "Maharashtra" },
                    { 31, 22.307200000000002, 73.181200000000004, "Vadodara", "vadodara", "Gujarat" },
                    { 32, 22.303899999999999, 70.802199999999999, "Rajkot", "rajkot", "Gujarat" },
                    { 33, 26.238900000000001, 73.024299999999997, "Jodhpur", "jodhpur", "Rajasthan" },
                    { 34, 24.5854, 73.712500000000006, "Udaipur", "udaipur", "Rajasthan" },
                    { 35, 25.317599999999999, 82.9739, "Varanasi", "varanasi", "Uttar Pradesh" },
                    { 36, 25.4358, 81.846299999999999, "Prayagraj", "prayagraj", "Uttar Pradesh" },
                    { 37, 28.984500000000001, 77.706400000000002, "Meerut", "meerut", "Uttar Pradesh" },
                    { 38, 28.367000000000001, 79.430400000000006, "Bareilly", "bareilly", "Uttar Pradesh" },
                    { 39, 26.7606, 83.373199999999997, "Gorakhpur", "gorakhpur", "Uttar Pradesh" },
                    { 40, 30.316500000000001, 78.032200000000003, "Dehradun", "dehradun", "Uttarakhand" },
                    { 41, 29.945699999999999, 78.164199999999994, "Haridwar", "haridwar", "Uttarakhand" },
                    { 42, 31.104800000000001, 77.173400000000001, "Shimla", "shimla", "Himachal Pradesh" },
                    { 43, 32.726599999999998, 74.856999999999999, "Jammu", "jammu", "Jammu and Kashmir" },
                    { 44, 34.0837, 74.797300000000007, "Srinagar", "srinagar", "Jammu and Kashmir" },
                    { 45, 31.634, 74.872299999999996, "Amritsar", "amritsar", "Punjab" },
                    { 46, 30.901, 75.857299999999995, "Ludhiana", "ludhiana", "Punjab" },
                    { 47, 31.326000000000001, 75.5762, "Jalandhar", "jalandhar", "Punjab" },
                    { 48, 21.2514, 81.629599999999996, "Raipur", "raipur", "Chhattisgarh" },
                    { 49, 22.079699999999999, 82.140900000000002, "Bilaspur", "bilaspur", "Chhattisgarh" },
                    { 50, 22.804600000000001, 86.2029, "Jamshedpur", "jamshedpur", "Jharkhand" },
                    { 51, 23.7957, 86.430400000000006, "Dhanbad", "dhanbad", "Jharkhand" },
                    { 52, 26.7271, 88.395300000000006, "Siliguri", "siliguri", "West Bengal" },
                    { 53, 23.520399999999999, 87.311899999999994, "Durgapur", "durgapur", "West Bengal" },
                    { 54, 20.462499999999999, 85.882999999999996, "Cuttack", "cuttack", "Odisha" },
                    { 55, 12.914099999999999, 74.855999999999995, "Mangaluru", "mangaluru", "Karnataka" },
                    { 56, 12.2958, 76.639399999999995, "Mysuru", "mysuru", "Karnataka" },
                    { 57, 15.364699999999999, 75.123999999999995, "Hubballi", "hubballi", "Karnataka" },
                    { 58, 17.968900000000001, 79.594099999999997, "Warangal", "warangal", "Telangana" },
                    { 59, 13.6288, 79.419200000000004, "Tirupati", "tirupati", "Andhra Pradesh" },
                    { 60, 11.664300000000001, 78.146000000000001, "Salem", "salem", "Tamil Nadu" },
                    { 61, 10.7905, 78.704700000000003, "Tiruchirappalli", "tiruchirappalli", "Tamil Nadu" },
                    { 62, 11.941599999999999, 79.808300000000003, "Puducherry", "puducherry", "Puducherry" },
                    { 63, 15.4909, 73.827799999999996, "Panaji", "panaji", "Goa" },
                    { 64, 23.831499999999998, 91.286799999999999, "Agartala", "agartala", "Tripura" },
                    { 65, 25.578800000000001, 91.893299999999996, "Shillong", "shillong", "Meghalaya" },
                    { 66, 24.817, 93.936800000000005, "Imphal", "imphal", "Manipur" },
                    { 67, 23.7271, 92.717600000000004, "Aizawl", "aizawl", "Mizoram" },
                    { 68, 25.6751, 94.108599999999996, "Kohima", "kohima", "Nagaland" },
                    { 69, 27.338899999999999, 88.606499999999997, "Gangtok", "gangtok", "Sikkim" },
                    { 70, 27.084399999999999, 93.6053, "Itanagar", "itanagar", "Arunachal Pradesh" },
                    { 71, 11.6234, 92.726500000000001, "Port Blair", "port-blair", "Andaman and Nicobar Islands" },
                    { 72, 28.459499999999998, 77.026600000000002, "Gurugram", "gurugram", "Haryana" },
                    { 73, 28.535499999999999, 77.391000000000005, "Noida", "noida", "Uttar Pradesh" },
                    { 74, 28.6692, 77.453800000000001, "Ghaziabad", "ghaziabad", "Uttar Pradesh" },
                    { 75, 28.408899999999999, 77.317800000000005, "Faridabad", "faridabad", "Haryana" }
                });

            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 1006, 6, "https://news.google.com/rss/search?q=Mumbai&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1007, 7, "https://news.google.com/rss/search?q=Bengaluru&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1008, 8, "https://news.google.com/rss/search?q=Hyderabad&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1009, 9, "https://news.google.com/rss/search?q=Chennai&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1010, 10, "https://news.google.com/rss/search?q=Kolkata&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1011, 11, "https://news.google.com/rss/search?q=Pune&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1012, 12, "https://news.google.com/rss/search?q=Ahmedabad&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1013, 13, "https://news.google.com/rss/search?q=Surat&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1014, 14, "https://news.google.com/rss/search?q=Jaipur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1015, 15, "https://news.google.com/rss/search?q=Chandigarh&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1016, 16, "https://news.google.com/rss/search?q=Indore&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1017, 17, "https://news.google.com/rss/search?q=Bhopal&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1018, 18, "https://news.google.com/rss/search?q=Patna&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1019, 19, "https://news.google.com/rss/search?q=Ranchi&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1020, 20, "https://news.google.com/rss/search?q=Bhubaneswar&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1021, 21, "https://news.google.com/rss/search?q=Guwahati&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1022, 22, "https://news.google.com/rss/search?q=Kochi&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1023, 23, "https://news.google.com/rss/search?q=Thiruvananthapuram&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1024, 24, "https://news.google.com/rss/search?q=Kozhikode&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1025, 25, "https://news.google.com/rss/search?q=Coimbatore&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1026, 26, "https://news.google.com/rss/search?q=Madurai&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1027, 27, "https://news.google.com/rss/search?q=Visakhapatnam&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1028, 28, "https://news.google.com/rss/search?q=Vijayawada&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1029, 29, "https://news.google.com/rss/search?q=Nagpur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1030, 30, "https://news.google.com/rss/search?q=Nashik&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1031, 31, "https://news.google.com/rss/search?q=Vadodara&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1032, 32, "https://news.google.com/rss/search?q=Rajkot&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1033, 33, "https://news.google.com/rss/search?q=Jodhpur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1034, 34, "https://news.google.com/rss/search?q=Udaipur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1035, 35, "https://news.google.com/rss/search?q=Varanasi&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1036, 36, "https://news.google.com/rss/search?q=Prayagraj&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1037, 37, "https://news.google.com/rss/search?q=Meerut&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1038, 38, "https://news.google.com/rss/search?q=Bareilly&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1039, 39, "https://news.google.com/rss/search?q=Gorakhpur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1040, 40, "https://news.google.com/rss/search?q=Dehradun&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1041, 41, "https://news.google.com/rss/search?q=Haridwar&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1042, 42, "https://news.google.com/rss/search?q=Shimla&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1043, 43, "https://news.google.com/rss/search?q=Jammu&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1044, 44, "https://news.google.com/rss/search?q=Srinagar&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1045, 45, "https://news.google.com/rss/search?q=Amritsar&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1046, 46, "https://news.google.com/rss/search?q=Ludhiana&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1047, 47, "https://news.google.com/rss/search?q=Jalandhar&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1048, 48, "https://news.google.com/rss/search?q=Raipur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1049, 49, "https://news.google.com/rss/search?q=Bilaspur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1050, 50, "https://news.google.com/rss/search?q=Jamshedpur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1051, 51, "https://news.google.com/rss/search?q=Dhanbad&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1052, 52, "https://news.google.com/rss/search?q=Siliguri&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1053, 53, "https://news.google.com/rss/search?q=Durgapur&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1054, 54, "https://news.google.com/rss/search?q=Cuttack&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1055, 55, "https://news.google.com/rss/search?q=Mangaluru&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1056, 56, "https://news.google.com/rss/search?q=Mysuru&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1057, 57, "https://news.google.com/rss/search?q=Hubballi&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1058, 58, "https://news.google.com/rss/search?q=Warangal&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1059, 59, "https://news.google.com/rss/search?q=Tirupati&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1060, 60, "https://news.google.com/rss/search?q=Salem&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1061, 61, "https://news.google.com/rss/search?q=Tiruchirappalli&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1062, 62, "https://news.google.com/rss/search?q=Puducherry&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1063, 63, "https://news.google.com/rss/search?q=Panaji&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1064, 64, "https://news.google.com/rss/search?q=Agartala&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1065, 65, "https://news.google.com/rss/search?q=Shillong&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1066, 66, "https://news.google.com/rss/search?q=Imphal&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1067, 67, "https://news.google.com/rss/search?q=Aizawl&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1068, 68, "https://news.google.com/rss/search?q=Kohima&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1069, 69, "https://news.google.com/rss/search?q=Gangtok&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1070, 70, "https://news.google.com/rss/search?q=Itanagar&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1071, 71, "https://news.google.com/rss/search?q=Port%20Blair&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1072, 72, "https://news.google.com/rss/search?q=Gurugram&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1073, 73, "https://news.google.com/rss/search?q=Noida&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1074, 74, "https://news.google.com/rss/search?q=Ghaziabad&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" },
                    { 1075, 75, "https://news.google.com/rss/search?q=Faridabad&hl=hi&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Rss" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1006);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1007);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1008);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1009);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1010);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1011);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1012);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1013);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1014);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1015);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1016);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1017);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1018);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1019);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1020);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1021);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1022);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1023);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1024);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1025);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1026);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1027);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1028);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1029);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1030);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1031);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1032);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1033);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1034);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1035);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1036);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1037);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1038);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1039);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1040);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1041);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1042);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1043);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1044);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1045);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1046);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1047);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1048);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1049);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1050);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1051);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1052);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1053);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1054);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1055);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1056);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1057);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1058);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1059);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1060);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1061);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1062);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1063);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1064);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1065);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1066);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1067);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1068);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1069);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1070);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1071);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1072);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1073);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1074);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1075);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 59);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 60);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 61);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 62);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 63);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 64);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 67);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 68);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 69);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 70);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 71);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 72);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 73);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 74);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 75);

            migrationBuilder.DropColumn(
                name: "latitude",
                table: "cities");

            migrationBuilder.DropColumn(
                name: "longitude",
                table: "cities");
        }
    }
}
